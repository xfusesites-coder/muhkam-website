/**
 * Muhkam — Admin Auth Handler
 * Vercel Serverless Function
 * Simple password-based auth with JWT
 */
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://muhkam.com').split(',').map(s => s.trim());

if (!process.env.ADMIN_JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('ADMIN_JWT_SECRET environment variable is required in production');
}
if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('ADMIN_PASSWORD environment variable is required in production');
}

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'muhkam-dev-secret-local-only');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muhkam2024';

export async function createToken() {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

function getCorsOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return origin;
  return ALLOWED_ORIGINS[0];
}

export default async function handler(req, res) {
  // CORS for admin
  const corsOrigin = getCorsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Constant-time comparison to prevent timing attacks
    const passwordBuffer = Buffer.from(password);
    const adminBuffer = Buffer.from(ADMIN_PASSWORD);

    if (passwordBuffer.length !== adminBuffer.length ||
        !crypto.timingSafeEqual(passwordBuffer, adminBuffer)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = await createToken();
    return res.status(200).json({ token });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
