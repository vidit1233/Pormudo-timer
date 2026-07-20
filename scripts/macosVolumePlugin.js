import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function enabled() {
  return process.platform === 'darwin' && process.env.DISABLE_MACOS_VOLUME_BRIDGE !== '1';
}

async function getOutputVolumePercent() {
  const { stdout } = await execFileAsync('osascript', [
    '-e',
    'output volume of (get volume settings)',
  ]);
  const n = parseInt(String(stdout).trim(), 10);
  if (Number.isNaN(n)) throw new Error('Could not read output volume');
  return Math.max(0, Math.min(100, n));
}

async function setOutputVolumePercent(percent) {
  const p = Math.round(Math.max(0, Math.min(100, percent)));
  await execFileAsync('osascript', ['-e', `set volume output volume ${p}`]);
}

function attachMiddleware(server) {
  server.middlewares.use((req, res, next) => {
    if (!enabled()) return next();

    const path = (req.url || '').split('?')[0];

    if (path === '/__macos/get-volume' && req.method === 'GET') {
      getOutputVolumePercent()
        .then((percent) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ volume: percent / 100 }));
        })
        .catch(() => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'get-volume failed' }));
        });
      return;
    }

    if (path === '/__macos/set-volume' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8') || '{}';
          const j = JSON.parse(raw);
          const vol = Number(j.volume);
          if (Number.isNaN(vol) || vol < 0 || vol > 1) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'volume must be 0..1' }));
            return;
          }
          setOutputVolumePercent(vol * 100)
            .then(() => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            })
            .catch(() => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'set-volume failed' }));
            });
        } catch {
          res.statusCode = 400;
          res.end('{}');
        }
      });
      return;
    }

    next();
  });
}

/** Bridges the UI knob to macOS output volume via AppleScript (dev / preview only). */
export function macosVolumePlugin() {
  return {
    name: 'macos-system-volume',
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server);
    },
  };
}
