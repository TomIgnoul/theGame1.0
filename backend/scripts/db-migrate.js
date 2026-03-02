#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv/config');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

async function migrate() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: dbUrl });
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
