import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'pathai-super-secret-jwt-key-2026';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, email: user.email, isGuest: user.username.startsWith('guest_') },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, tokenType: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function getUserIdFromAuthHeader(req) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    return decoded ? decoded.userId : null;
  } catch (err) {
    return null;
  }
}
