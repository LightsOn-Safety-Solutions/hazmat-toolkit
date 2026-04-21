import test from 'node:test';
import assert from 'node:assert/strict';
import { getViewerAccessJoinCodeUpdate } from './index.js';

test('disabling viewer access does not require rotating the viewer join code', async () => {
  const pool = {
    async query() {
      throw new Error('query should not be called when disabling viewer access');
    }
  };

  const nextJoinCode = await getViewerAccessJoinCodeUpdate(pool, false);

  assert.equal(nextJoinCode, null);
});

test('enabling viewer access keeps the existing viewer join code', async () => {
  const pool = {
    async query() {
      throw new Error('query should not be called when enabling viewer access');
    }
  };

  const nextJoinCode = await getViewerAccessJoinCodeUpdate(pool, true);

  assert.equal(nextJoinCode, null);
});
