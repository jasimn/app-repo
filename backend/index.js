require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // allow frontend to talk to backend (adjust origin in prod)

const PORT = process.env.PORT || 3000;

let pool;
async function initDbPool(){
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'simpleapp',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  // optional quick check
  await pool.query('SELECT 1');
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('db error');
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if(!name || !email) return res.status(400).send('name and email required');
    const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    const newId = result.insertId;
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [newId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('db error');
  }
});

app.listen(PORT, async () => {
  try {
    await initDbPool();
    console.log(`Backend listening on port ${PORT}`);
  } catch (err) {
    console.error('Failed to initialize DB pool:', err);
    process.exit(1);
  }
});
