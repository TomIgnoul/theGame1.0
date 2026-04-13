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
  const repoRoot = path.join(__dirname, '..', '..');
  const migrationsDir = path.join(repoRoot, 'db', 'migrations');
  const fallbackSchemaPath = path.join(__dirname, '../src/db/schema.sql');

  try {
    const migrationFiles = fs.existsSync(migrationsDir)
      ? fs
          .readdirSync(migrationsDir)
          .filter((name) => name.endsWith('.sql'))
          .sort()
      : [];

    if (migrationFiles.length === 0) {
      const schema = fs.readFileSync(fallbackSchemaPath, 'utf8');
      console.log(`[migrate] running ${fallbackSchemaPath}`);
      await pool.query(schema);
    } else {
      for (const fileName of migrationFiles) {
        const migrationPath = path.join(migrationsDir, fileName);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`[migrate] running ${migrationPath}`);
        await pool.query(sql);
      }
    }

    console.log('[migrate] done');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
