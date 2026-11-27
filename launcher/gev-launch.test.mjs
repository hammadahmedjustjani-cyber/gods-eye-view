import assert from 'node:assert/strict';
import net from 'node:net';
import { test } from 'node:test';
import { findFreePort, needsInstall, nodeTooOld } from './gev-launch.mjs';

// Importing the module runs main() only when this file is the entry point, so
// these tests exercise the exported helpers without starting a server.

test('nodeTooOld follows the engines field: 24.14 is the floor', () => {
  assert.equal(nodeTooOld('22.22.3'), true);
  assert.equal(nodeTooOld('24.13.9'), true);
  assert.equal(nodeTooOld('24.14.0'), false);
  assert.equal(nodeTooOld('24.22.2'), false);
  assert.equal(nodeTooOld('v26.0.0'), false);
  // Unparseable input must not be treated as a supported runtime.
  assert.equal(nodeTooOld(''), true);
});

test('findFreePort returns a port that can be bound', async () => {
  const port = await findFreePort(4390, 5);
  assert.ok(Number.isInteger(port) && port >= 4390 && port < 4395);
});

test('findFreePort skips a port that is already taken', async () => {
  // Occupy the first candidate, then ask for a port in that range: the answer
  // must move on rather than hand back the busy port, and stay in range.
  const busy = await findFreePort(4410, 5);
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(busy, '127.0.0.1', resolve);
  });
  try {
    const chosen = await findFreePort(busy, 5);
    assert.notEqual(chosen, busy);
    assert.ok(chosen > busy && chosen < busy + 5);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('needsInstall is true for a tree with no installed dependencies', () => {
  // The repository root under CI has node_modules/ from `npm ci`, but a random
  // empty directory stands in for a freshly extracted ZIP.
  assert.equal(needsInstall('/nonexistent-gev-root'), true);
});
