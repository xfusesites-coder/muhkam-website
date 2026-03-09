/**
 * Xfuse — Run SQL schema on Supabase
 * Usage: node scripts/setup-supabase.js
 */
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Client } = pg;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in .env');
  process.exit(1);
}

// Extract project ref from URL
const ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Try Session Pooler first (IPv4 compatible), then direct connection
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.argv[2];
if (!DB_PASSWORD) {
  console.error('Usage: SUPABASE_DB_PASSWORD=xxx node scripts/setup-supabase.js');
  process.exit(1);
}

const encodedPassword = encodeURIComponent(DB_PASSWORD);

const connectionConfigs = [
  {
    name: 'Session Pooler (eu-central-1)',
    host: `aws-0-eu-central-1.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${ref}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Session Pooler (us-east-1)',
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${ref}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Session Pooler (eu-west-2)',
    host: `aws-0-eu-west-2.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${ref}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Session Pooler (ap-southeast-1)',
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${ref}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
  {
    name: 'Transaction Pooler (eu-central-1)',
    host: `aws-0-eu-central-1.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  },
];

async function tryConnect(config) {
  const { name, ...pgConfig } = config;
  const client = new Client({
    ...pgConfig,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

async function main() {
  const schemaPath = join(process.cwd(), 'supabase-schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');

  let client = null;

  for (const config of connectionConfigs) {
    try {
      console.log(`Trying ${config.name}...`);
      client = await tryConnect(config);
      console.log(`✓ Connected via ${config.name}`);
      break;
    } catch (err) {
      console.log(`✗ ${config.name} failed: ${err.message}`);
    }
  }

  if (!client) {
    console.error('\nCould not connect to Supabase database.');
    console.error('Please run the SQL schema manually in the Supabase SQL Editor.');
    process.exit(1);
  }

  try {
    console.log('\nRunning schema...');
    await client.query(sql);
    console.log('✓ Schema created successfully!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('⚠ Some objects already exist (this is OK if re-running)');
    } else {
      console.error('Schema error:', err.message);
    }
  } finally {
    await client.end();
  }
}

main();
