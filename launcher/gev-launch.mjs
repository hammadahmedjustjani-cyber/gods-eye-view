#!/usr/bin/env node
/**
 * Portable one-click launcher for a God's Eye View checkout.
 *
 * Started by START-GODS-EYE-VIEW.bat (Windows) or start-gods-eye-view.sh
 * (macOS/Linux). It
 *
 *   1. refuses to run on a Node older than the app supports,
 *   2. installs `node_modules` on first run (and again if package-lock.json
 *      changed, tracked by a stamp file),
 *   3. finds a free port starting at 4173,
 *   4. starts the app's own Vite dev server on 127.0.0.1,
 *   5. opens the system browser once the server reports ready.
 *
 * Deliberately does none of the app's security policy: it launches the normal
 * dev server, so the Host-header allowlist, CSP and framing headers behave
 * exactly as they do under `npm run dev`. Only loopback is bound, so the
 * API-key-brokering routes are never exposed to the network.
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP = path.join(ROOT, 'node_modules', '.gev-launcher-stamp');
const LOG_FILE = path.join(ROOT, 'launcher', 'launch.log');
const LOCK_FILE = path.join(ROOT, 'package-lock.json');
const firstPort = Number.parseInt(process.env.PORT || '4173', 10);
const FIRST_PORT = Number.isInteger(firstPort) ? firstPort : 4173;
const MIN_NODE = { major: 24, minor: 14 };

const isWindows = process.platform === 'win32';
const say = (message) => console.log(`[GEV] ${message}`);

/**
 * The launcher's log, mirrored to launcher/launch.log for later inspection.
 * Opened lazily: importing this module (for its helpers, in tests) must not
 * truncate a log a running launcher is writing to.
 */
let logStream;
function record(line) {
  const text = String(line);
  process.stdout.write(text);
  logStream ??= createWriteStream(LOG_FILE, { flags: 'w' });
  logStream.write(text);
}

function parseVersion(value) {
  const [major = 0, minor = 0, patch = 0] = String(value)
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
  return { major, minor, patch };
}

/** True when this Node is at least the version the app's engines field asks for. */
export function nodeTooOld(version = process.versions.node) {
  const { major, minor } = parseVersion(version);
  if (major > MIN_NODE.major) return false;
  if (major < MIN_NODE.major) return true;
  return minor < MIN_NODE.minor;
}

/** Ask the OS for a TCP port nobody is listening on, from `start` upward. */
export function findFreePort(start = FIRST_PORT, tries = 40) {
  return new Promise((resolve, reject) => {
    let port = start;
    const attempt = () => {
      if (port >= start + tries) {
        reject(new Error(`no free port in ${start}-${start + tries - 1}`));
        return;
      }
      const probe = createServer();
      probe.once('error', () => {
        port += 1;
        attempt();
      });
      probe.once('listening', () => {
        const { port: free } = probe.address();
        probe.close(() => resolve(free));
      });
      probe.listen(port, '127.0.0.1');
    };
    attempt();
  });
}

/** Whether node_modules is missing or was installed from a different lockfile. */
export function needsInstall(root = ROOT) {
  if (!existsSync(path.join(root, 'node_modules', 'vite'))) return true;
  if (!existsSync(path.join(root, 'package-lock.json'))) return false;
  if (!existsSync(STAMP)) return true;
  return readFileSync(STAMP, 'utf8').trim() !== lockStamp(root);
}

function lockStamp(root = ROOT) {
  const lock = readFileSync(path.join(root, 'package-lock.json'));
  // Cheap content fingerprint: size + first/last bytes + a rolling sum. Good
  // enough to notice a regenerated lockfile without pulling in crypto.
  let sum = 0;
  for (let i = 0; i < lock.length; i += 97) sum = (sum + lock[i] * (i + 1)) % 1e9;
  return `${lock.length}-${lock.readUInt8(0)}-${lock[lock.length - 1]}-${sum}`;
}

function runNpm(args) {
  const npm = isWindows ? 'npm.cmd' : 'npm';
  say(`Installing dependencies (first run only, a few minutes): npm ${args.join(' ')}`);
  const result = spawnSync(npm, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows, // npm.cmd needs a shell on Windows
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' },
  });
  if (result.error) throw result.error;
  record(result.stdout ? result.stdout.toString() : '');
  const err = result.stderr ? result.stderr.toString() : '';
  if (result.status !== 0) {
    record(err);
    throw new Error(`npm ${args.join(' ')} failed with exit code ${result.status}`);
  }
  // Engine warnings are expected noise on a slightly old Node; keep the tail.
  const notable = err
    .split(/\r?\n/)
    .filter((line) => line && !/EBADENGINE|Unsupported engine|npm warn deprecated/.test(line))
    .slice(-12)
    .join('\n');
  if (notable) record(`${notable}\n`);
  writeFileSync(STAMP, `${lockStamp()}\n`);
  say('Dependencies ready.');
}

/** Open a URL in the default browser, without shell-injection surface. */
function openBrowser(url) {
  say(`Opening ${url}`);
  if (isWindows) {
    // `start` is a cmd builtin; the empty "" is the window title slot.
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsVerbatimArguments: true,
    }).unref();
    return;
  }
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(opener, [url], { detached: true, stdio: 'ignore' });
  child.on('error', () => say('Could not open a browser automatically; use the URL above.'));
  child.unref();
}

async function main() {
  say(`God's Eye View launcher — ${ROOT}`);

  if (nodeTooOld()) {
    say(
      `Node ${process.versions.node} is too old. This app needs Node ` +
        `${MIN_NODE.major}.${MIN_NODE.minor} or newer.`,
    );
    say('Install the current LTS from https://nodejs.org/ and run this file again.');
    process.exitCode = 1;
    return;
  }

  if (needsInstall()) {
    // `npm ci` needs the lockfile and installs exactly it; without one (an
    // unpacked source archive) `npm install` is the only option.
    const locked = existsSync(path.join(ROOT, 'package-lock.json'));
    runNpm([locked ? 'ci' : 'install', '--no-audit', '--no-fund']);
  } else {
    say('Dependencies already installed.');
  }

  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}/`;
  say(`Starting the server on ${url}`);

  // A shell is required on Windows so this resolves `vite.cmd`, exactly as
  // `npm run dev` does. Arguments are constant strings, never user input.
  const child = spawn(
    isWindows ? 'npx.cmd' : 'npx',
    [
      '--no-install',
      'vite',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: ROOT,
      shell: isWindows,
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  // A spawn failure (npx missing, thin Node installs) would otherwise surface
  // only as a silent closed window.
  child.on('error', (error) => {
    say(`Could not start the server: ${error.message}`);
    process.exitCode = 1;
  });

  let opened = false;
  const watch = (chunk) => {
    const text = chunk.toString();
    record(text);
    if (!opened && /(Local:\s+http|ready in)/i.test(text)) {
      opened = true;
      // Vite prints its banner before the port truly accepts connections, but
      // it is listening by then; a short grace period avoids a blank tab.
      setTimeout(() => openBrowser(url), 700);
    }
  };
  child.stdout.on('data', watch);
  child.stderr.on('data', watch);
  if (!process.env.GEV_LAUNCHER_NO_BROWSER) {
    // Fallback: never leave the user staring at a silent console.
    setTimeout(() => {
      if (!opened) {
        opened = true;
        openBrowser(url);
      }
    }, 30000);
  }

  const shutdown = (signal) => {
    say(`Stopping (${signal})…`);
    if (!child.killed) child.kill();
    setTimeout(() => process.exit(0), 300);
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => shutdown(signal));
  }

  child.on('exit', (code) => {
    say(`Server stopped (exit ${code ?? 0}). You can close this window.`);
    process.exit(code ?? 0);
  });
}

/** Run only when executed directly, so tests can import the helpers. */
function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url));
  }
}

if (isDirectRun()) {
  main().catch((error) => {
    say(`Failed: ${error.message}`);
    say(`See ${LOG_FILE} for details.`);
    process.exitCode = 1;
  });
}