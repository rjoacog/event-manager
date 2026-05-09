import pool from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const missing = (v) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "");

export async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (missing(email) || missing(password)) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, role`,
      [email, hashed]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to register" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (missing(email) || missing(password)) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
}
