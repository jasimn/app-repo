require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

let pool;

/**
 * Initialize MySQL connection with retry
 * Required for Kubernetes startup ordering
 */
async function initDbPoolWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
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

      await pool.query('SELECT 1');
      console.log('✅ Connected to MySQL');
      return;
    } catch (err) {
      console.error(`❌ DB connection attempt ${i} failed: ${err.message}`);

      if (i === retries) {
        console.error('🚨 Max DB retries reached. Exiting.');
        process.exit(1);
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Health endpoint (used by Kubernetes probes)
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Get users
 */
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email FROM users ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

/**
 * Create user
 */
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).send('Name and email required');
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

/**
 * Start server immediately, then connect to DB
 */
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  initDbPoolWithRetry();
});
