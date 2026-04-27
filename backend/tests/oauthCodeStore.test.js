import test from 'node:test';
import assert from 'node:assert/strict';

test('oauth code store consumes code only once', async () => {
  const { createOAuthCode, consumeOAuthCode } = await import('../src/utils/oauthCodeStore.js');

  const code = createOAuthCode('token-123');
  assert.equal(consumeOAuthCode(code), 'token-123');
  assert.equal(consumeOAuthCode(code), null);
});
