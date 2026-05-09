import pool from "../db/index.js";

export async function getAllEvents(req, res) {
  try {
    const { category } = req.query;
    const hasCategory =
      category !== undefined &&
      category !== null &&
      String(category).trim() !== "";

    let result;
    if (hasCategory) {
      result = await pool.query(
        `SELECT e.*
         FROM events e
         JOIN event_categories ec ON e.id = ec.event_id
         WHERE ec.category_id = $1`,
        [category]
      );
    } else {
      result = await pool.query("SELECT * FROM events");
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
}

export async function createEvent(req, res) {
  try {
    const { title, description, date, location } = req.body;

    const missing = (v) =>
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "");

    if (missing(title) || missing(date)) {
      return res.status(400).json({
        error: "title and date are required",
      });
    }

    const creator_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO events (title, description, date, location, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description ?? null, date, location ?? null, creator_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, date, location } = req.body;

    const keys = ["title", "description", "date", "location"];
    const has = (k) => Object.prototype.hasOwnProperty.call(req.body, k);

    if (!keys.some(has)) {
      return res.status(400).json({
        error: "At least one of title, description, date, location must be provided",
      });
    }

    const v1 = has("title") ? (title ?? null) : null;
    const v2 = has("description") ? (description ?? null) : null;
    const v3 = has("date") ? (date ?? null) : null;
    const v4 = has("location") ? (location ?? null) : null;

    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await pool.query(
      `UPDATE events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           date = COALESCE($3, date),
           location = COALESCE($4, location)
       WHERE id = $5 AND (creator_id = $6 OR $7 = 'admin')
       RETURNING *`,
      [v1, v2, v3, v4, id, userId, userRole]
    );

    if (result.rows.length === 0) {
      const exists = await pool.query("SELECT id FROM events WHERE id = $1", [
        id,
      ]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: "Event not found" });
      }
      return res.status(403).json({ message: "Not allowed or not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await pool.query(
      `DELETE FROM events
       WHERE id = $1 AND (creator_id = $2 OR $3 = 'admin')
       RETURNING *`,
      [id, userId, userRole]
    );

    if (result.rows.length === 0) {
      const exists = await pool.query("SELECT id FROM events WHERE id = $1", [
        id,
      ]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: "Not allowed or not found" });
      }
      return res.status(403).json({ message: "Not allowed or not found" });
    }

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
}

export async function getMyEvents(req, res) {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admins do not have event registrations",
      });
    }

    const user_id = req.user.id;
    const result = await pool.query(
      `SELECT e.*, r.id AS registration_id
       FROM events e
       JOIN registrations r ON e.id = r.event_id
       WHERE r.user_id = $1`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch my events" });
  }
}

export async function addCategoriesToEvent(req, res) {
  try {
    const { id } = req.params;
    const { categories } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        error: "categories must be a non-empty array",
      });
    }

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [
      id,
    ]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = eventResult.rows[0];
    const allowed =
      Number(event.creator_id) === Number(userId) || userRole === "admin";
    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    for (const category_id of categories) {
      await pool.query(
        `INSERT INTO event_categories (event_id, category_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, category_id]
      );
    }

    res.json({ message: "Categories added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add categories to event" });
  }
}

export async function syncEventCategories(req, res) {
  try {
    const { id } = req.params;
    let { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        error: "categories must be an array",
      });
    }

    const normalized = [
      ...new Set(
        categories
          .map((c) => Number(c))
          .filter((n) => !Number.isNaN(n))
      ),
    ];

    const userId = req.user.id;
    const userRole = req.user.role;

    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [
      id,
    ]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = eventResult.rows[0];
    const allowed =
      Number(event.creator_id) === Number(userId) || userRole === "admin";
    if (!allowed) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM event_categories WHERE event_id = $1", [
        id,
      ]);
      for (const category_id of normalized) {
        await client.query(
          `INSERT INTO event_categories (event_id, category_id)
           VALUES ($1, $2)`,
          [id, category_id]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.json({ message: "Categories updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sync event categories" });
  }
}

export async function getEventCategories(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*
       FROM categories c
       JOIN event_categories ec ON c.id = ec.category_id
       WHERE ec.event_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event categories" });
  }
}
