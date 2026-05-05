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

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EPIPE',
  '57P03',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const code = err.code;
  const message = typeof err.message === 'string' ? err.message : '';

  return (
    RETRYABLE_ERROR_CODES.has(code) ||
    /the database system is starting up/i.test(message) ||
    /terminating connection due to administrator command/i.test(message)
  );
}

async function waitForDatabase(pool) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      if (attempt > 1) {
        console.log(`[migrate] database became ready on attempt ${attempt}`);
      }
      return;
    } catch (err) {
      if (!isRetryableError(err) || attempt === MAX_ATTEMPTS) {
        throw err;
      }

      console.log(
        `[migrate] database not ready yet (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message}`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function migrate() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: dbUrl });
  const repoRoot = path.join(__dirname, '..', '..');
  const migrationsDir = path.join(repoRoot, 'db', 'migrations');
  const fallbackSchemaPath = path.join(__dirname, '../src/db/schema.sql');

  try {
    await waitForDatabase(pool);

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
