// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

let pool;

async function initDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql_db',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'rootpassword',
      database: process.env.DB_NAME || 'testdb',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
    // quick test
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL (pool ready)');
  } catch (err) {
    console.error('DB init failed:', err.message || err);
    // retry after delay
    await new Promise(r => setTimeout(r, 5000));
    return initDb();
  }
}

app.get('/', (req, res) => {
  res.send('✅ Node app is reachable');
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).send('DB query failed');
  }
});

(async () => {
  await initDb();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Server listening at http://${HOST}:${PORT}`);
  });
})();
