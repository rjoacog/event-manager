import pool from "../db/index.js";

const missing = (v) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "");

export async function createRegistration(req, res) {
  try {
    const { event_id } = req.body;
    const user_id = req.user.id;

    if (missing(event_id)) {
      return res.status(400).json({ error: "event_id is required" });
    }

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [
      event_id,
    ]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const result = await pool.query(
      `INSERT INTO registrations (user_id, event_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, event_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ message: "Already registered" });
    }
    res.status(500).json({ error: "Failed to create registration" });
  }
}

export async function deleteRegistration(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await pool.query(
      `DELETE FROM registrations
       WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')
       RETURNING *`,
      [id, userId, userRole]
    );

    if (result.rows.length === 0) {
      const exists = await pool.query(
        "SELECT id FROM registrations WHERE id = $1",
        [id]
      );
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: "Not allowed or not found" });
      }
      return res.status(403).json({ message: "Not allowed or not found" });
    }

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete registration" });
  }
}
