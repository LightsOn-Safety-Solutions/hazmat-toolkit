import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_JOIN_CODE_TTL_MINUTES,
  resolveJoinCodeTtlMinutes
} from './sessions.js';

test('defaults join code expiration to seven days', () => {
  assert.equal(resolveJoinCodeTtlMinutes(undefined), 10_080);
  assert.equal(resolveJoinCodeTtlMinutes(0), 10_080);
  assert.equal(resolveJoinCodeTtlMinutes(Number.NaN), 10_080);
});

test('respects requested TTL values up to seven days', () => {
  assert.equal(resolveJoinCodeTtlMinutes(60), 60);
  assert.equal(resolveJoinCodeTtlMinutes(10_080), 10_080);
  assert.equal(resolveJoinCodeTtlMinutes(20_000), MAX_JOIN_CODE_TTL_MINUTES);
});

test('uses the configured fallback when the request omits a TTL', () => {
  assert.equal(resolveJoinCodeTtlMinutes(undefined, 1_440), 1_440);
  assert.equal(resolveJoinCodeTtlMinutes(undefined, 20_000), MAX_JOIN_CODE_TTL_MINUTES);
});
