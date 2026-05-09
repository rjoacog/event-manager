import pool from "../db/index.js";

export async function getAllCategories(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}
