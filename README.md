# Event Manager

**Event Manager** es una aplicación web fullstack para gestionar eventos, inscripciones y categorías, con login por JWT y roles (`user` / `admin`).

Stack:

- **Node.js** — runtime del servidor
- **Express** — API REST y archivos estáticos del frontend
- **PostgreSQL** — usuarios, eventos, inscripciones y categorías
- **JavaScript vanilla** — interfaz en `public/` (sin framework SPA)
- **JWT** — autenticación con token `Bearer` en rutas protegidas

---

## Funcionalidades

- **Registro** e **inicio de sesión** de usuarios
- Autenticación **JWT**
- Sistema de **roles** (`user` / `admin`)
- **CRUD de eventos** (limitado por permisos en la API)
- **Inscripciones** a eventos y listado de **Mis eventos**
- **Categorías** con relación muchos a muchos con eventos
- **Filtrado de eventos por categoría**
- Interfaz responsive

---

## Roles

### Usuario (`user`)

- Ver eventos (con filtro por categoría)
- **Inscribirse** a eventos
- Abrir **Mis eventos** para ver inscripciones y **cancelar** una inscripción

### Administrador (`admin`)

- **Crear** eventos
- **Editar** y **eliminar** eventos
- **Asignar y sincronizar categorías** por evento en la interfaz (el catálogo de categorías está en la base)

---

## Arquitectura del proyecto

El front está en `public/` (`index.html`, `app.js`, `styles.css`): HTML/CSS y JS con `fetch` contra `/api`.

El back es Express en `server.js`: monta rutas bajo `/api`, sirve estáticos y usa PostgreSQL vía el pool de `db/index.js`. Los endpoints viven en `routes/` y llaman a `controllers/` (ahí están las consultas SQL y las respuestas). `middleware/auth.js` verifica el JWT y rellena `req.user`; las reglas por rol se aplican en los controladores.

Flujo: navegador → Express → PostgreSQL. Login en `POST /api/auth/login` devuelve un JWT firmado con `JWT_SECRET`; el cliente lo guarda y manda `Authorization: Bearer …`. El front muestra u oculta cosas según el rol del token; el servidor vuelve a comprobar permisos en cada operación.

```
project-root/
├── controllers/
├── routes/
├── middleware/
├── db/
├── public/
├── server.js
└── README.md
```

También están `package.json`, `.gitignore`, `.env` local, etc.

Carpetas del backend, en síntesis:

- **`controllers/`** — lógica, respuestas HTTP y consultas SQL con el pool de `pg`.
- **`routes/`** — paths y verbos; encadena `authenticate` donde hace falta.
- **`middleware/`** — validación del JWT (`authenticate`).
- **`db/`** — pool de conexión a PostgreSQL (`DATABASE_URL`).

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd TP3
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo `.env`

En la raíz del proyecto, crea un archivo `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/Gestion_Eventos
JWT_SECRET=your_secret
```

| Variable       | Descripción                                           |
| -------------- | ----------------------------------------------------- |
| `PORT`         | Puerto en el que escucha Express (por defecto `3000`) |
| `DATABASE_URL` | URL de conexión a PostgreSQL                          |
| `JWT_SECRET`   | Secreto para firmar y verificar los JWT               |

No subas `.env` al repositorio.

---

## Base de datos

### 1. Crear la base de datos en PostgreSQL

```bash
createdb Gestion_Eventos
# o en psql: CREATE DATABASE "Gestion_Eventos";
```

El nombre debe coincidir con el de `DATABASE_URL`.

### 2. Ejecutar scripts SQL

Guarda el esquema siguiente, por ejemplo como `sql/schema.sql`, y ejecútalo:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

Ejemplo de creación de tablas:

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       VARCHAR(32) NOT NULL DEFAULT 'user'
);

CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  location    TEXT,
  creator_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE registrations (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  UNIQUE (user_id, event_id)
);

CREATE TABLE event_categories (
  event_id    INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);
```

---

## Crear categorías

Datos iniciales de ejemplo:

```sql
INSERT INTO categories (name) VALUES
  ('Tecnología'),
  ('Música'),
  ('Deporte');
```

La aplicación las obtiene con `GET /api/categories`.

---

## Crear usuario administrador

Los registros nuevos suelen tener rol `user`. Para promover una cuenta:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Sustituye `admin@example.com` por el correo real de la cuenta.

El rol viaja en el JWT: si lo cambias en la base, hay que iniciar sesión de nuevo para obtener un token con `admin`.

---

## Ejecutar la aplicación

### Arrancar el backend

```bash
node server.js
```

O:

```bash
npm start
```

Desarrollo con recarga automática:

```bash
npm run dev
```

El servidor escucha en el puerto configurado (por defecto 3000).

### Abrir el frontend

Express sirve la carpeta `public/`. Abre el navegador en:

**http://localhost:3000**

Mismo origen que la API (`/api/...`).

---

## Notas importantes

- Los administradores no se inscriben en eventos (la API lo rechaza para el rol `admin`).
- El catálogo de categorías se carga desde la base; los admins las asignan a eventos en la UI.
- Las **rutas protegidas** requieren la cabecera `Authorization: Bearer <token>`; si el token falta o no es válido, la respuesta es `401`.

---

## Interfaz

- Toasts para éxito y error
- Modales de confirmación en acciones sensibles (eliminar evento, cancelar inscripción)
- Contenido y botones distintos según rol (`user` / `admin`)

---

## /health

```bash
curl http://localhost:3000/health
```

Respuesta: `{"status":"ok"}`.

---

## Preguntas Conceptuales

### 1. ¿Qué es un servidor web y cómo funciona el ciclo request-response?

Un servidor web es un programa que recibe solicitudes HTTP desde un cliente (por ejemplo, el navegador) y devuelve una respuesta. El ciclo request-response funciona cuando el cliente hace una petición a una ruta, el servidor procesa esa solicitud (validaciones, lógica, consultas SQL, etc.) y finalmente devuelve una respuesta, generalmente en formato JSON o HTML.

### 2. ¿Qué es Express y por qué lo usamos en lugar de usar solo Node.js?

Express es un framework para Node.js que simplifica la creación de servidores y APIs. Lo usamos porque permite organizar rutas, middlewares y controladores de manera más sencilla y ordenada. Con solo Node.js habría que manejar muchas cosas manualmente, haciendo el código más complejo y difícil de mantener.

### 3. ¿Qué es un JWT y cómo se diferencia de guardar la sesión en el servidor?

Un JWT (JSON Web Token) es un token que contiene información del usuario autenticada y se envía en cada request protegida. A diferencia de las sesiones tradicionales, el servidor no necesita guardar la sesión en memoria o base de datos, porque toda la información necesaria viaja dentro del token firmado.

### 4. ¿Qué ventaja tiene usar un procedimiento almacenado en lugar de escribir ese SQL desde Node.js?

Un procedimiento almacenado permite guardar lógica SQL directamente dentro de la base de datos. Esto ayuda a reutilizar consultas complejas, mejorar el rendimiento y mantener ciertas operaciones más centralizadas y seguras, evitando repetir lógica SQL en distintos lugares del backend.

### 5. ¿Por qué es importante usar transacciones? Poné un ejemplo de cuándo un ROLLBACK salva la integridad de los datos.

Las transacciones son importantes porque permiten ejecutar varias operaciones SQL como una sola unidad. Si una operación falla, se puede hacer ROLLBACK para deshacer todos los cambios y evitar datos inconsistentes. Por ejemplo, si un usuario se registra a un evento y falla alguna inserción relacionada, el rollback evita que queden datos incompletos en la base.

### 6. ¿Qué es un trigger? Describe el trigger que implementaste y en qué momento se dispara.

En este proyecto no implementé triggers porque eran opcionales. Sin embargo, un trigger es una acción automática que ejecuta la base de datos cuando ocurre un evento como un INSERT, UPDATE o DELETE sobre una tabla.
