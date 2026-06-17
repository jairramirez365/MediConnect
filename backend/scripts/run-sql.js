const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const scriptPath = process.argv[2];

if (!scriptPath) {
  console.error('Usage: node scripts/run-sql.js <relative-sql-path>');
  process.exit(1);
}

const absoluteSqlPath = path.resolve(__dirname, scriptPath);
const sql = fs.readFileSync(absoluteSqlPath, 'utf8');

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log(`SQL executed successfully: ${absoluteSqlPath}`);
  } catch (error) {
    console.error(`SQL execution failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
