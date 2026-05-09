const appHeader = document.getElementById("app-header");
const navEvents = document.getElementById("nav-events");
const navMyEvents = document.getElementById("nav-my-events");
const authSection = document.getElementById("auth-section");
const eventsSection = document.getElementById("events-section");
const myEventsSection = document.getElementById("my-events-section");
const eventsList = document.getElementById("events-list");
const myEventsList = document.getElementById("my-events-list");
const globalMessage = document.getElementById("global-message");
const loginBtn = document.getElementById("login-btn");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");
const registerBtn = document.getElementById("register-btn");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerMessage = document.getElementById("register-message");
const userInfo = document.getElementById("user-info");
const toggleCreateEventBtn = document.getElementById("toggle-create-event");
const createEventFormBlock = document.getElementById("create-event-form-block");
const createEventBtn = document.getElementById("create-event-btn");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const locationInput = document.getElementById("location");
const createMessage = document.getElementById("create-message");
const editEventDialog = document.getElementById("edit-event-dialog");
const editEventForm = document.getElementById("edit-event-form");
const editEventIdInput = document.getElementById("edit-event-id");
const editTitleInput = document.getElementById("edit-title");
const editDescriptionInput = document.getElementById("edit-description");
const editDateInput = document.getElementById("edit-date");
const editLocationInput = document.getElementById("edit-location");
const editEventCancelBtn = document.getElementById("edit-event-cancel");
const editEventMessage = document.getElementById("edit-event-message");
let globalMessageTimeout;

function setAppHeaderVisible(visible) {
  if (appHeader) appHeader.style.display = visible ? "block" : "none";
}

setAppHeaderVisible(Boolean(localStorage.getItem("token")));

function checkAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    setAppHeaderVisible(true);
    hideAllSections();
    eventsSection?.classList.remove("hidden");
    scrollToTop();
  } else {
    setAppHeaderVisible(false);
    hideAllSections();
    authSection?.classList.remove("hidden");
    showAuthForm("login");
    scrollToTop();
  }
  updateUserInfo();
}

function showMessage(message, type) {
  if (!globalMessage) return;

  globalMessage.removeAttribute("data-loading");
  globalMessage.textContent = message;
  globalMessage.style.color = type === "success" ? "green" : "red";

  if (globalMessageTimeout) clearTimeout(globalMessageTimeout);
  globalMessageTimeout = setTimeout(() => {
    globalMessage.textContent = "";
    globalMessage.style.color = "";
  }, 3000);
}

function showLoadingFeedback(text) {
  if (!globalMessage) return;
  if (globalMessageTimeout) clearTimeout(globalMessageTimeout);
  globalMessage.textContent = text;
  globalMessage.style.color = "";
  globalMessage.setAttribute("data-loading", "true");
}

function clearLoadingFeedback() {
  if (!globalMessage || !globalMessage.hasAttribute("data-loading")) return;
  globalMessage.removeAttribute("data-loading");
  globalMessage.textContent = "";
  globalMessage.style.color = "";
}

function clearMessages() {
  if (globalMessage) {
    globalMessage.textContent = "";
    globalMessage.removeAttribute("data-loading");
    globalMessage.style.color = "";
  }
  if (loginMessage) loginMessage.textContent = "";
  if (registerMessage) registerMessage.textContent = "";
  if (createMessage) createMessage.textContent = "";
  if (editEventMessage) editEventMessage.textContent = "";
}

function setGlobalControlsDisabled(disabled) {
  const buttons = [
    toggleCreateEventBtn,
    createEventBtn,
    logoutBtn,
    loginBtn,
    registerBtn,
    showLoginBtn,
    showRegisterBtn,
  ];
  for (const el of buttons) {
    if (el) el.disabled = disabled;
  }
  for (const el of [navEvents, navMyEvents]) {
    if (!el) continue;
    el.style.pointerEvents = disabled ? "none" : "";
    el.setAttribute("aria-disabled", disabled ? "true" : "false");
    if (disabled) el.classList.add("nav-link-disabled");
    else el.classList.remove("nav-link-disabled");
  }
}

let uiBusyDepth = 0;

function beginUiBusy() {
  uiBusyDepth += 1;
  if (uiBusyDepth === 1) setGlobalControlsDisabled(true);
}

function endUiBusy() {
  uiBusyDepth = Math.max(0, uiBusyDepth - 1);
  if (uiBusyDepth === 0) setGlobalControlsDisabled(false);
}

function clearUiState() {
  if (globalMessageTimeout) {
    clearTimeout(globalMessageTimeout);
    globalMessageTimeout = null;
  }
  clearMessages();
  if (eventsList) eventsList.innerHTML = "";
  if (myEventsList) myEventsList.innerHTML = "";
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
  if (registerEmailInput) registerEmailInput.value = "";
  if (registerPasswordInput) registerPasswordInput.value = "";
  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (dateInput) dateInput.value = "";
  if (locationInput) locationInput.value = "";
  showAuthForm("login");
  if (createEventFormBlock) createEventFormBlock.style.display = "none";
  toggleCreateEventBtn?.setAttribute("aria-expanded", "false");
  if (editEventDialog?.open) editEventDialog.close();
  uiBusyDepth = 0;
  setGlobalControlsDisabled(false);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuthForm(which) {
  if (which === "register") {
    loginForm?.classList.add("hidden");
    registerForm?.classList.remove("hidden");
  } else {
    loginForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");
  }
}

function hideAllSections() {
  authSection?.classList.add("hidden");
  eventsSection?.classList.add("hidden");
  myEventsSection?.classList.add("hidden");
}

function showAuth() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  setAppHeaderVisible(false);
  hideAllSections();
  authSection.classList.remove("hidden");
  showAuthForm("login");
  scrollToTop();
}

function showEvents() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  const token = localStorage.getItem("token");
  if (!token || !getUserFromToken()) {
    showAuth();
    showMessage("Inicia sesión para ver los eventos", "error");
    return;
  }
  setAppHeaderVisible(true);
  hideAllSections();
  eventsSection.classList.remove("hidden");
  scrollToTop();
}

function showMyEvents() {
  if (!authSection || !eventsSection || !myEventsSection) return;
  const token = localStorage.getItem("token");
  if (!token || !getUserFromToken()) {
    showAuth();
    showMessage("Inicia sesión para ver tus eventos", "error");
    return;
  }
  setAppHeaderVisible(true);
  hideAllSections();
  myEventsSection.classList.remove("hidden");
  scrollToTop();
}

function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return {
      id: payload.id,
      role: payload.role,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

function applyCreateEventUiForRole() {
  const user = getUserFromToken();
  const isAdmin = user?.role === "admin";
  const panel = document.getElementById("create-event-panel");

  if (!panel || !toggleCreateEventBtn || !createEventFormBlock) return;

  if (isAdmin) {
    panel.classList.remove("hidden");
    toggleCreateEventBtn.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
    toggleCreateEventBtn.classList.add("hidden");
    createEventFormBlock.style.display = "none";
    toggleCreateEventBtn.setAttribute("aria-expanded", "false");
  }
}

function applyNavbarForRole() {
  const user = getUserFromToken();
  if (!navMyEvents) return;
  if (user?.role === "admin") {
    navMyEvents.style.display = "none";
  } else {
    navMyEvents.style.display = "";
  }
}

function updateUserInfo() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      if (userInfo) userInfo.textContent = "Sin sesión";
      return;
    }

    let email = "";
    let idVal;
    let roleVal;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      email = typeof payload.email === "string" ? payload.email.trim() : "";
      idVal = payload.id;
      roleVal = payload.role;
    } catch (err) {
      console.error(err);
      if (userInfo) userInfo.textContent = "Sin sesión";
      return;
    }

    if (userInfo) {
      if (email) {
        userInfo.textContent = email;
      } else if (idVal != null) {
        userInfo.textContent = `Usuario #${idVal}`;
      } else if (roleVal) {
        userInfo.textContent = String(roleVal);
      } else {
        userInfo.textContent = "Sesión activa";
      }
    }
  } finally {
    applyCreateEventUiForRole();
    applyNavbarForRole();
  }
}

function formatDate(dateString) {
  if (dateString == null || dateString === "") return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateForEditInput(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function closeEditEventDialog() {
  if (editEventDialog?.open) editEventDialog.close();
  if (editEventMessage) {
    editEventMessage.textContent = "";
    editEventMessage.style.color = "";
  }
}

async function openEditEventDialog(eventId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const getRes = await fetch(`http://localhost:3000/api/events/${eventId}`);
    const ev = await getRes.json().catch(() => ({}));
    if (!getRes.ok) {
      showMessage(ev?.message || ev?.error || "No se pudo cargar el evento", "error");
      return;
    }

    if (editEventIdInput) editEventIdInput.value = String(eventId);
    if (editTitleInput) editTitleInput.value = ev.title ?? "";
    if (editDescriptionInput) editDescriptionInput.value = ev.description ?? "";
    if (editDateInput) editDateInput.value = formatDateForEditInput(ev.date);
    if (editLocationInput) editLocationInput.value = ev.location ?? "";
    if (editEventMessage) {
      editEventMessage.textContent = "";
      editEventMessage.style.color = "";
    }

    editEventDialog?.showModal();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar el evento", "error");
  } finally {
    endUiBusy();
  }
}

async function saveEditEventFromDialog() {
  if (!editEventForm?.checkValidity()) {
    editEventForm?.reportValidity();
    return;
  }

  const id = editEventIdInput?.value;
  const token = localStorage.getItem("token");
  if (!id || !token) {
    if (editEventMessage) {
      editEventMessage.textContent = "Sesión o evento no válido";
      editEventMessage.style.color = "red";
    }
    return;
  }

  const body = {
    title: editTitleInput?.value?.trim() ?? "",
    description: editDescriptionInput?.value?.trim() ?? "",
    date: editDateInput?.value ?? "",
    location: editLocationInput?.value?.trim() ?? "",
  };

  beginUiBusy();
  try {
    const putRes = await fetch(`http://localhost:3000/api/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await putRes.json().catch(() => ({}));
    if (!putRes.ok) {
      if (editEventMessage) {
        editEventMessage.textContent =
          data?.message || data?.error || "No se pudo guardar";
        editEventMessage.style.color = "red";
      }
      return;
    }

    closeEditEventDialog();
    showMessage("Evento actualizado", "success");
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    if (editEventMessage) {
      editEventMessage.textContent = "Error al guardar";
      editEventMessage.style.color = "red";
    }
  } finally {
    endUiBusy();
  }
}

async function deleteEvent(eventId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch(`http://localhost:3000/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(data?.message || data?.error || "Error al eliminar evento", "error");
      return;
    }

    showMessage("Evento eliminado", "success");
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al eliminar evento", "error");
  } finally {
    endUiBusy();
  }
}

async function registerToEvent(eventId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch("http://localhost:3000/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_id: eventId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(data?.message || data?.error || "Error al inscribirse", "error");
      return;
    }

    showMessage("Inscripción exitosa", "success");
  } catch (err) {
    console.error(err);
    showMessage("Error al inscribirse", "error");
  } finally {
    endUiBusy();
  }
}

async function cancelRegistration(registrationId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch(
      `http://localhost:3000/api/registrations/${registrationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showMessage(
        data?.message || data?.error || "Error al cancelar inscripción",
        "error"
      );
      return;
    }

    showMessage("Inscripción cancelada", "success");
    await loadMyEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cancelar inscripción", "error");
  } finally {
    endUiBusy();
  }
}

async function fetchAndRenderEvents() {
  clearMessages();
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  beginUiBusy();
  showLoadingFeedback("Cargando eventos…");
  if (eventsList) eventsList.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch("http://localhost:3000/api/events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error al cargar eventos", res.status, await res.text());
      if (eventsList) eventsList.innerHTML = "";
      showMessage("Error al cargar eventos", "error");
      return;
    }

    const events = await res.json();
    if (eventsList) eventsList.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      if (eventsList) eventsList.innerHTML = "<p>No events found</p>";
      return;
    }

    const currentUser = getUserFromToken();
    const currentUserRole = currentUser?.role;

    for (const event of events) {
      const row = document.createElement("div");
      row.className = "event-card";
      const title = document.createElement("div");
      title.className = "event-title";
      title.textContent = event.title ?? "(sin título)";
      const date = document.createElement("div");
      date.className = "event-meta";
      date.textContent = `Fecha: ${formatDate(event.date)}`;
      const location = document.createElement("div");
      location.className = "event-meta";
      location.textContent = `Ubicación: ${event.location ?? "-"}`;
      const description = document.createElement("div");
      description.className = "event-meta";
      description.textContent = `Descripción: ${event.description ?? "-"}`;
      const actions = document.createElement("div");
      actions.className = "event-actions";
      row.appendChild(title);
      row.appendChild(date);
      row.appendChild(location);
      row.appendChild(description);

      if (currentUserRole === "user") {
        const registerBtnEl = document.createElement("button");
        registerBtnEl.type = "button";
        registerBtnEl.className = "btn btn-primary";
        registerBtnEl.textContent = "Inscribirme";
        registerBtnEl.onclick = () => registerToEvent(event.id);
        actions.appendChild(registerBtnEl);
      }

      if (currentUserRole === "admin") {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-secondary";
        editButton.textContent = "Editar";
        editButton.onclick = () => openEditEventDialog(event.id);
        actions.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent = "Eliminar";
        deleteButton.onclick = () => deleteEvent(event.id);
        actions.appendChild(deleteButton);
      }

      if (actions.childElementCount > 0) {
        row.appendChild(actions);
      }
      eventsList?.appendChild(row);
    }
  } finally {
    clearLoadingFeedback();
    endUiBusy();
  }
}

async function loadMyEvents() {
  clearMessages();
  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("Inicia sesión para continuar", "error");
    return;
  }

  const user = getUserFromToken();
  if (user?.role === "admin") {
    showMessage("Admins do not have event registrations", "error");
    if (myEventsList) myEventsList.innerHTML = "";
    return;
  }

  beginUiBusy();
  showLoadingFeedback("Cargando tus eventos…");
  if (myEventsList) myEventsList.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch("http://localhost:3000/api/registrations/my-events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error al cargar mis eventos", res.status, await res.text());
      if (myEventsList) myEventsList.innerHTML = "";
      showMessage("Error al cargar mis eventos", "error");
      return;
    }

    const events = await res.json();
    if (myEventsList) myEventsList.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
      if (myEventsList) myEventsList.innerHTML = "<p>No events found</p>";
      return;
    }

    for (const event of events) {
      const row = document.createElement("div");
      row.className = "event-card";
      const title = document.createElement("div");
      title.className = "event-title";
      title.textContent = event.title ?? "(sin título)";
      const date = document.createElement("div");
      date.className = "event-meta";
      date.textContent = `Fecha: ${formatDate(event.date)}`;
      const location = document.createElement("div");
      location.className = "event-meta";
      location.textContent = `Ubicación: ${event.location ?? "-"}`;
      const description = document.createElement("div");
      description.className = "event-meta";
      description.textContent = `Descripción: ${event.description ?? "-"}`;
      const actions = document.createElement("div");
      actions.className = "event-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-secondary";
      button.textContent = "Cancelar inscripción";
      button.onclick = () => cancelRegistration(event.registration_id);
      row.appendChild(title);
      row.appendChild(date);
      row.appendChild(location);
      row.appendChild(description);
      actions.appendChild(button);
      row.appendChild(actions);
      myEventsList?.appendChild(row);
    }
  } catch (err) {
    console.error(err);
    if (myEventsList) myEventsList.innerHTML = "";
    showMessage("Error al cargar mis eventos", "error");
  } finally {
    clearLoadingFeedback();
    endUiBusy();
  }
}

showLoginBtn?.addEventListener("click", () => {
  showAuthForm("login");
});

showRegisterBtn?.addEventListener("click", () => {
  showAuthForm("register");
});

toggleCreateEventBtn?.addEventListener("click", () => {
  if (!createEventFormBlock) return;
  const show = createEventFormBlock.style.display !== "block";
  createEventFormBlock.style.display = show ? "block" : "none";
  toggleCreateEventBtn?.setAttribute("aria-expanded", String(show));
});

editEventCancelBtn?.addEventListener("click", () => {
  closeEditEventDialog();
});

editEventForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  void saveEditEventFromDialog();
});

editEventDialog?.addEventListener("click", (e) => {
  if (e.target === editEventDialog) closeEditEventDialog();
});

loginBtn?.addEventListener("click", async () => {
  const email = emailInput?.value?.trim() ?? "";
  const password = passwordInput?.value ?? "";

  if (!email || !password) {
    showMessage("Email y contraseña son obligatorios", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(data?.message || "Error al iniciar sesión", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    showMessage("Sesión iniciada", "success");
    checkAuth();
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al iniciar sesión", "error");
  } finally {
    endUiBusy();
  }
});

registerBtn?.addEventListener("click", async () => {
  const email = registerEmailInput?.value?.trim() ?? "";
  const password = registerPasswordInput?.value ?? "";

  beginUiBusy();
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(
        data?.message || data?.error || "No se pudo crear la cuenta",
        "error"
      );
      return;
    }

    showMessage("Cuenta creada correctamente", "success");
  } catch (err) {
    console.error(err);
    showMessage("Error al registrar la cuenta", "error");
  } finally {
    endUiBusy();
  }
});

navEvents?.addEventListener("click", async (e) => {
  e.preventDefault();
  showEvents();
  if (!localStorage.getItem("token")) return;
  try {
    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar eventos", "error");
  }
});

navMyEvents?.addEventListener("click", async (e) => {
  e.preventDefault();
  showMyEvents();
  if (!localStorage.getItem("token")) return;
  try {
    await loadMyEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al cargar tus eventos", "error");
  }
});

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  clearUiState();
  checkAuth();
  showMessage("Sesión cerrada", "success");
});

createEventBtn?.addEventListener("click", async () => {
  const title = titleInput?.value?.trim() ?? "";
  const description = descriptionInput?.value?.trim() ?? "";
  const date = dateInput?.value ?? "";
  const location = locationInput?.value?.trim() ?? "";
  const token = localStorage.getItem("token");

  if (!token) {
    showMessage("Inicia sesión para crear eventos", "error");
    return;
  }

  beginUiBusy();
  try {
    const res = await fetch("http://localhost:3000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, date, location }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMessage(data?.message || data?.error || "Error al crear evento", "error");
      return;
    }

    showMessage("Evento creado correctamente", "success");
    if (titleInput) titleInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    if (dateInput) dateInput.value = "";
    if (locationInput) locationInput.value = "";

    await fetchAndRenderEvents();
  } catch (err) {
    console.error(err);
    showMessage("Error al crear evento", "error");
  } finally {
    endUiBusy();
  }
});

checkAuth();
if (localStorage.getItem("token")) {
  fetchAndRenderEvents().catch((err) => {
    console.error(err);
    showMessage("Error al cargar eventos", "error");
  });
}
