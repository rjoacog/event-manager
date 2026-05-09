import "dotenv/config";
import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";
import authRouter from "./routes/auth.js";
import registrationsRouter from "./routes/registrations.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/events", eventsRouter);
app.use("/api/auth", authRouter);
app.use("/api/registrations", registrationsRouter);

// ruta de prueba
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
