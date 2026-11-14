import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH ??= path.join(os.tmpdir(), `seasonlens-test-${process.pid}-${randomUUID()}.sqlite`);
const { app } = await import('../src/index.js');

export async function withServer(fn) {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const { port } = server.address();
  try { await fn(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

export async function request(base, route, options = {}) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  return { status: response.status, body: await response.json() };
}
