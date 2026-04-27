import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT = process.env.PORT || '5000';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zeeklect-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-test-key-123';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test('issueAccessToken keeps compatibility claims and expiration', async () => {
  const { issueAccessToken, verifyAccessToken } = await import('../src/utils/jwt.js');

  const token = issueAccessToken({ id: 'user-123', email: 'user@example.com' });
  const decoded = verifyAccessToken(token);

  assert.equal(decoded.userId, 'user-123');
  assert.equal(decoded.sub, 'user@example.com');
  assert.equal(decoded.email, 'user@example.com');
  assert.ok(decoded.exp > decoded.iat);
});
