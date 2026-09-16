import http from 'node:http';
import https from 'node:https';
import {
  randomBytes,
  randomUUID,
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  statSync,
  createReadStream,
  rmSync,
} from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.mjs';
import { probe, renderComposition, styles } from './composition.mjs';
import { validateManualEntries } from '../lib/player-model.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const data = resolve(process.env.OURFRAME_DATA || join(root, 'data'));
mkdirSync(data, { recursive: true });
mkdirSync(join(data, 'media'), { recursive: true });
mkdirSync(join(data, 'renders'), { recursive: true });
const db = openStore(data),
  secretFile = join(data, 'signing-key');
if (!existsSync(secretFile))
  writeFileSync(secretFile, randomBytes(32), { mode: 0o600 });
const secret = readFileSync(secretFile),
  hash = (s) => createHash('sha256').update(s).digest('hex');
const token = () => randomBytes(24).toString('base64url');
const maxFile = Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 ** 3;
const maxStorage = Number(process.env.MAX_STORAGE_BYTES) || 50 * 1024 ** 3;
const allowed = new Set(
  (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:4100'
  )
    .split(',')
    .map((s) => s.trim()),
);
const uploadLocks = new Set(),
  rates = new Map();
// Operator console: one line per session milestone so field-test progress is
// visible in the worker terminal. Never log tokens, invites, or paths.
const milestone = (msg) =>
  console.log(`[${new Date().toLocaleTimeString('en-GB')}] \u25B8 ${msg}`);
let rendering = false;
function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
function text(value, min = 1, max = 100) {
  if (
    typeof value !== 'string' ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(400, `Enter text between ${min} and ${max} characters.`);
  return value.trim();
}
function number(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    fail(400, `Value must be between ${min} and ${max}.`);
  return n;
}
async function body(req, max = 65536) {
  let parts = [],
    size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) fail(413, 'Upload chunk is too large.');
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}
async function json(req) {
  try {
    return JSON.parse((await body(req)).toString());
  } catch (e) {
    if (e.status) throw e;
    fail(400, 'Invalid JSON.');
  }
}
function send(res, status, value) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(value));
}
function session(id) {
  const s = db.get('session', id);
  if (!s) fail(404, 'Session not found.');
  return s;
}
function member(req, id) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!t) fail(401, 'Open your invitation to join this session.');
  const m = db.list('member', id).find((m) => m.tokenHash === hash(t));
  if (!m) fail(403, 'You do not have access to this session.');
  return m;
}
function publicMember(m) {
  const { tokenHash, ...rest } = m;
  return rest;
}
function mediaUrl(kind, id, sessionId) {
  const expires = (Math.floor(Date.now() / 3600000) + 2) * 3600000,
    payload = `${kind}:${id}:${sessionId}:${expires}`,
    signature = createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');
  return `/api/media/${kind}/${id}?session=${sessionId}&expires=${expires}&signature=${signature}`;
}
function snapshot(s, m) {
  const { inviteHash, invite, ...safe } = s;
  return {
    ...safe,
    invite: m.role === 'host' ? invite : undefined,
    self: publicMember(m),
    members: db.list('member', s.id).map(publicMember),
    clips: db
      .list('clip', s.id)
      .map(({ path, ...c }) => ({ ...c, url: mediaUrl('clip', c.id, s.id) })),
    jobs: db
      .list('job', s.id)
      .map(({ path, ...j }) => ({
        ...j,
        url: j.status === 'done' ? mediaUrl('job', j.id, s.id) : undefined,
      })),
  };
}
function rate(req) {
  const key = req.socket.remoteAddress || 'unknown',
    now = Date.now(),
    r = rates.get(key);
  if (!r || now - r.time > 60000) {
    rates.set(key, { time: now, count: 1 });
    return;
  }
  if (++r.count > 30) fail(429, 'Please wait a minute before trying again.');
  if (rates.size > 10000) rates.clear();
}
function makeMember(sessionId, name, role) {
  const credential = token(),
    m = {
      id: randomUUID(),
      sessionId,
      name: text(name),
      role,
      tokenHash: hash(credential),
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      position: 'overview',
      armed: false,
      clockError: null,
    };
  db.put('member', m);
  return { m, credential };
}

async function handler(req, res) {
  const receivedAt = performance.timeOrigin + performance.now();
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
    const origin = req.headers.origin;
    if (origin) {
      // Browsers send Origin on same-origin module-script and CORS-mode requests
      // too; rejecting those turns the app into a rendered-but-dead page. A
      // request whose Origin host matches the Host it arrived on is same-origin.
      const sameHost = origin.replace(/^https?:\/\//, '') === req.headers.host;
      if (!allowed.has(origin) && !sameHost)
        fail(
          403,
          'This frontend origin is not allowed. Configure ALLOWED_ORIGINS on the worker.',
        );
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-Upload-Offset',
      );
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = new URL(req.url, 'http://localhost'),
      parts = url.pathname.split('/').filter(Boolean),
      method = req.method;
    if (url.pathname === '/api/health')
      return send(res, 200, {
        ok: true,
        mode: 'local-worker',
        rendering,
        version: '0.1.0',
      });
    if (url.pathname === '/api/time')
      return send(res, 200, {
        serverTime: Date.now(),
        receivedAt,
        sentAt: performance.timeOrigin + performance.now(),
        epoch: String(performance.timeOrigin),
      });
    if (method === 'POST' && url.pathname === '/api/sessions') {
      rate(req);
      const b = await json(req);
      if (b.consent !== true)
        fail(
          400,
          'Confirm that participants agree to this private recording session.',
        );
      const sports = [
        'basketball',
        'squash',
        'dance',
        'jiujitsu',
        'gym',
        'pickleball',
        'memories',
      ];
      if (!sports.includes(b.sport)) fail(400, 'Choose a supported activity.');
      const invite = token(),
        s = {
          id: randomUUID(),
          name: text(b.name),
          sport: b.sport,
          group: text(b.group || 'My crew'),
          collection: text(b.collection || 'Practice sessions'),
          createdAt: Date.now(),
          status: 'setup',
          take: 0,
          startAt: null,
          stopAt: null,
          invite,
          inviteHash: hash(invite),
        };
      db.put('session', s);
      const { m, credential } = makeMember(s.id, b.displayName, 'host');
      milestone(`session "${s.name}" created by ${m.name} (${s.sport})`);
      return send(res, 201, { session: snapshot(s, m), token: credential });
    }
    if (method === 'POST' && url.pathname === '/api/join') {
      rate(req);
      const b = await json(req);
      if (b.consent !== true) fail(400, 'Consent is required before joining.');
      const s = db
        .list('session')
        .find((s) => s.inviteHash === hash(text(b.invite, 20, 100)));
      if (!s) fail(404, 'This invitation is invalid or has been replaced.');
      if (db.list('member', s.id).length >= 20)
        fail(409, 'This pilot session already has 20 participants.');
      const { m, credential } = makeMember(s.id, b.displayName, 'guest');
      milestone(`${m.name} joined "${s.name}" (${db.list('member', s.id).length} participants)`);
      return send(res, 201, { session: snapshot(s, m), token: credential });
    }
    if (parts[0] === 'api' && parts[1] === 'sessions' && parts[2]) {
      const s = session(parts[2]),
        m = member(req, s.id),
        action = parts[3];
      if (method === 'GET' && !action) return send(res, 200, snapshot(s, m));
      if (method === 'PATCH' && action === 'self') {
        const b = await json(req);
        if (b.position !== undefined) m.position = text(b.position, 1, 40);
        if (b.armed !== undefined) m.armed = b.armed === true;
        if (b.clockError !== undefined)
          m.clockError = number(b.clockError, 0, 60000);
        if (b.captureInfo !== undefined)
          m.captureInfo = text(b.captureInfo, 0, 100);
        m.lastSeen = Date.now();
        db.put('member', m);
        return send(res, 200, publicMember(m));
      }
      if (method === 'POST' && action === 'control') {
        if (m.role !== 'host')
          fail(403, 'Only the host can start or stop the session.');
        const b = await json(req);
        if (b.action === 'start') {
          if (s.status === 'recording')
            fail(409, 'This take is already recording.');
          const ready = db
            .list('member', s.id)
            .filter((x) => x.armed && Date.now() - x.lastSeen < 20000);
          if (!ready.length) fail(409, 'At least one camera must be ready.');
          s.status = 'recording';
          s.startAt = Date.now() + 8000;
          s.stopAt = null;
          s.take++;
          s.armedIds = ready.map((x) => x.id);
          milestone(`take ${s.take} starting in 8s on "${s.name}" with ${ready.length} camera(s)`);
        } else if (b.action === 'stop') {
          if (s.status !== 'recording') fail(409, 'No take is recording.');
          s.stopAt = Date.now() + 1500;
          s.status = 'stopped';
          milestone(`take ${s.take} stopped on "${s.name}" \u2014 waiting for uploads`);
        } else fail(400, 'Unknown control action.');
        db.put('session', s);
        return send(res, 200, snapshot(s, m));
      }
      if (method === 'POST' && action === 'rotate-invite') {
        if (m.role !== 'host')
          fail(403, 'Only the host can replace invitations.');
        s.invite = token();
        s.inviteHash = hash(s.invite);
        db.put('session', s);
        return send(res, 200, snapshot(s, m));
      }
      if (method === 'POST' && action === 'uploads') {
        const b = await json(req),
          clientId = text(b.clientId, 8, 100),
          prior = db
            .list('upload', s.id)
            .find((u) => u.ownerId === m.id && u.clientId === clientId);
        if (prior)
          return send(res, 200, {
            id: prior.id,
            offset: prior.offset,
            status: prior.status,
          });
        const size = number(b.size, 1, maxFile);
        if (!Number.isInteger(size)) fail(400, 'Invalid file size.');
        const reserved =
          db.list('upload').reduce((v, u) => v + u.size, 0) +
          db
            .list('job')
            .filter((j) => j.path && existsSync(j.path))
            .reduce((v, j) => v + statSync(j.path).size, 0);
        if (reserved + size > maxStorage)
          fail(
            507,
            'Pilot storage budget reached. Ask the host to export and remove old sessions.',
          );
        const id = randomUUID(),
          u = {
            id,
            sessionId: s.id,
            ownerId: m.id,
            clientId,
            size,
            name: text(b.name, 1, 160),
            mime: text(b.mime || 'video/mp4', 1, 100),
            startTime: number(b.startTime, 0, Date.now() + 86400000),
            clockError:
              b.clockError == null ? null : number(b.clockError, 0, 60000),
            marks: Array.isArray(b.marks)
              ? b.marks.slice(0, 200).map((n) => number(n, 0, 7200))
              : [],
            offset: 0,
            status: 'uploading',
            createdAt: Date.now(),
            path: join(data, 'media', `${id}.source`),
          };
        if (Array.isArray(b.clockAnchors))
          u.clockAnchors = b.clockAnchors
            .slice(0, 300)
            .map((a) => ({
              sequence: number(a.sequence, 0, 10000),
              elapsedMs: number(a.elapsedMs, 0, 7400000),
              offset: number(a.offset, -86400000, 86400000),
              roundTrip: number(a.roundTrip, 0, 120000),
              measuredAt: number(a.measuredAt, 0, Date.now() + 86400000),
              evidence: 'recorder-callback-clock-estimate',
            }));
        writeFileSync(u.path, Buffer.alloc(0));
        db.put('upload', u);
        return send(res, 201, { id, offset: 0, status: u.status });
      }
      if (method === 'POST' && action === 'retry-take') {
        const b = await json(req),
          job = db.get('job', b.jobId);
        if (!job || job.sessionId !== s.id) fail(404, 'Take not found.');
        if (job.memberId !== m.id && m.role !== 'host')
          fail(403, 'Only the creator or host can retry this take.');
        if (job.status !== 'failed')
          return send(res, 200, {
            id: job.id,
            status: job.status,
            takeNumber: job.takeNumber,
          });
        if (
          db
            .list('job', s.id)
            .filter((j) => ['queued', 'rendering'].includes(j.status)).length >=
          8
        )
          fail(429, 'Let queued takes finish before retrying.');
        job.status = 'queued';
        job.progress = 0;
        delete job.error;
        db.put('job', job);
        void work();
        return send(res, 200, {
          id: job.id,
          status: job.status,
          takeNumber: job.takeNumber,
        });
      }
      if (method === 'POST' && action === 'compose') {
        // Allocation is synchronous after reading the request: one local worker owns this store.
        const b = await json(req);
        if (!styles.includes(b.style)) fail(400, 'Choose a supported style.');
        if (!['all', 'camera', 'person'].includes(b.scope))
          fail(400, 'Choose a supported selection.');
        if (!['portrait', 'landscape'].includes(b.aspect))
          fail(400, 'Choose an output format.');
        const requestId =
          b.requestId === undefined ? undefined : text(b.requestId, 8, 100);
        if (requestId) {
          const previous = db
            .list('job', s.id)
            .find((j) => j.memberId === m.id && j.requestId === requestId);
          if (previous) return send(res, 202, previous);
        }
        const clips = db.list('clip', s.id);
        if (!clips.length) fail(409, 'Upload at least one video first.');
        if (
          b.scope === 'person' &&
          !clips.some((c) => (c.tags || []).some((t) => t.memberId === m.id))
        )
          fail(
            409,
            'Tag yourself in Footage before requesting a personal edit.',
          );
        if (b.scope === 'camera' && !clips.some((c) => c.ownerId === m.id))
          fail(409, 'You have not uploaded footage from this device.');
        let manual;
        if (b.entries !== undefined) {
          if (b.scope !== 'all')
            fail(400, 'Chosen moments use the all-camera selection.');
          try {
            manual = validateManualEntries(clips, b.entries);
          } catch (e) {
            fail(400, e.message);
          }
        }
        if (
          db
            .list('job', s.id)
            .filter((j) => ['queued', 'rendering'].includes(j.status)).length >=
          8
        )
          fail(
            429,
            'This session has eight edits queued. Let them finish first.',
          );
        const existing = db
          .list('job', s.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        let highest = Math.max(0, ...existing.map((j) => j.takeNumber || 0));
        for (const old of existing)
          if (!old.takeNumber) {
            old.takeNumber = ++highest;
            db.put('job', old);
          }
        const j = {
          id: randomUUID(),
          sessionId: s.id,
          memberId: m.id,
          requestId,
          takeNumber: highest + 1,
          title: b.title ? text(b.title, 1, 100) : 'Our moments',
          entries: manual?.entries,
          style: b.style,
          scope: b.scope,
          aspect: b.aspect,
          duration: manual?.duration ?? number(b.duration, 5, 120),
          useMarks: b.useMarks !== false,
          status: 'queued',
          progress: 0,
          createdAt: Date.now(),
          clipIds: clips.map((c) => c.id),
        };
        db.put('job', j);
        void work();
        milestone(`edit queued: take ${j.takeNumber} (${j.style}, ${j.aspect}, ${j.scope})`);
        return send(res, 202, j);
      }
      if (method === 'DELETE' && !action) {
        if (m.role !== 'host')
          fail(403, 'Only the host can remove this session.');
        if (db.list('job', s.id).some((j) => j.status === 'rendering'))
          fail(
            409,
            'Wait for the active edit to finish before removing the session.',
          );
        if (db.list('upload', s.id).some((u) => uploadLocks.has(u.id)))
          fail(409, 'Wait for the active upload to finish.');
        for (const kind of ['clip', 'upload', 'job', 'member'])
          for (const row of db.list(kind, s.id)) {
            if (kind === 'upload' && row.path)
              rmSync(row.path, { force: true });
            if (kind === 'job') {
              const directory = resolve(data, 'renders', row.id);
              if (
                directory.startsWith(resolve(data, 'renders') + '\\') ||
                directory.startsWith(resolve(data, 'renders') + '/')
              )
                rmSync(directory, { recursive: true, force: true });
            }
            db.delete(kind, row.id);
          }
        db.delete('session', s.id);
        milestone(`session "${s.name}" deleted by host \u2014 media removed`);
        return send(res, 200, { deleted: true });
      }
    }
    if (parts[0] === 'api' && parts[1] === 'uploads' && parts[2]) {
      const u = db.get('upload', parts[2]);
      if (!u) fail(404, 'Upload not found.');
      const m = member(req, u.sessionId);
      if (m.id !== u.ownerId)
        fail(403, 'This upload belongs to another device.');
      if (method === 'GET')
        return send(res, 200, { id: u.id, offset: u.offset, status: u.status });
      if (uploadLocks.has(u.id))
        fail(409, 'This upload is already receiving data.');
      if (method === 'PUT') {
        if (u.status !== 'uploading')
          fail(409, 'This upload is already complete.');
        const offset = number(req.headers['x-upload-offset'], 0, u.size);
        if (offset !== u.offset)
          fail(
            409,
            'Upload offset changed. Resume from the acknowledged offset.',
          );
        uploadLocks.add(u.id);
        try {
          const chunk = await body(req, 2 * 1024 ** 2);
          if (!chunk.length || u.offset + chunk.length > u.size)
            fail(400, 'Unexpected upload length.');
          if (statSync(u.path).size !== u.offset)
            fail(409, 'Upload storage length mismatch.');
          appendFileSync(u.path, chunk);
          u.offset += chunk.length;
          db.put('upload', u);
          return send(res, 200, { offset: u.offset });
        } finally {
          uploadLocks.delete(u.id);
        }
      }
      if (method === 'POST' && parts[3] === 'complete') {
        if (u.status === 'complete') {
          const { path, ...safe } = db.get('clip', u.id);
          return send(res, 200, safe);
        }
        if (u.offset !== u.size) fail(409, 'Upload is not complete yet.');
        uploadLocks.add(u.id);
        try {
          const info = await probe(u.path);
          if (info.duration > 7200 || info.width > 7680 || info.height > 7680)
            fail(400, 'This pilot supports videos up to two hours and 8K.');
          const c = {
            ...u,
            ...info,
            tags: [],
            status: undefined,
            marks: u.marks.filter((n) => n < info.duration),
          };
          db.put('clip', c);
          u.status = 'complete';
          db.put('upload', u);
          milestone(`upload complete: "${c.name}" (${Math.round(info.duration)}s, ${Math.round(u.size / 1024 ** 2)} MB) \u2014 ${db.list('clip', u.sessionId).length} clip(s) in session`);
          const { path, ...safe } = c;
          return send(res, 201, {
            ...safe,
            url: mediaUrl('clip', c.id, c.sessionId),
          });
        } finally {
          uploadLocks.delete(u.id);
        }
      }
    }
    if (
      parts[0] === 'api' &&
      parts[1] === 'clips' &&
      parts[2] &&
      method === 'PATCH'
    ) {
      const c = db.get('clip', parts[2]);
      if (!c) fail(404, 'Clip not found.');
      const m = member(req, c.sessionId),
        b = await json(req);
      if (b.tag) {
        const start = number(b.tag.start, 0, c.duration),
          end = number(b.tag.end, 0, c.duration);
        if (end <= start) fail(400, 'End must be after start.');
        if ((c.tags || []).length >= 200)
          fail(400, 'This clip has reached its tag limit.');
        c.tags = [...(c.tags || []), { memberId: m.id, start, end }];
      }
      if (b.clearMyTags)
        c.tags = (c.tags || []).filter((t) => t.memberId !== m.id);
      if (b.mark !== undefined) {
        if ((c.marks || []).length >= 200)
          fail(400, 'This clip has reached its moment limit.');
        c.marks = [...(c.marks || []), number(b.mark, 0, c.duration)];
      }
      db.put('clip', c);
      return send(res, 200, { ok: true });
    }
    if (parts[0] === 'api' && parts[1] === 'media' && parts[2] && parts[3]) {
      const [kind, id] = parts.slice(2),
        sessionId = url.searchParams.get('session'),
        expires = url.searchParams.get('expires'),
        sig = url.searchParams.get('signature') || '';
      if (
        !['clip', 'job'].includes(kind) ||
        !Number.isFinite(+expires) ||
        +expires < Date.now()
      )
        fail(403, 'Media link expired. Reopen the session.');
      const expected = createHmac('sha256', secret)
        .update(`${kind}:${id}:${sessionId}:${expires}`)
        .digest('base64url');
      if (
        sig.length !== expected.length ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      )
        fail(403, 'Invalid media access.');
      const record = db.get(kind, id);
      if (
        !record ||
        record.sessionId !== sessionId ||
        !record.path ||
        !existsSync(record.path)
      )
        fail(404, 'Media unavailable.');
      const size = statSync(record.path).size,
        range = req.headers.range;
      let start = 0,
        end = size - 1,
        status = 200;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) fail(416, 'Invalid range.');
        if (!match[1]) start = Math.max(0, size - Number(match[2]));
        else start = Number(match[1]);
        if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
        if (start > end || start >= size) fail(416, 'Invalid range.');
        status = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      }
      res.writeHead(status, {
        'Content-Type':
          kind === 'job' ? 'video/mp4' : record.mime.split(';')[0],
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
        ...(url.searchParams.has('download')
          ? { 'Content-Disposition': 'attachment; filename="ourframe.mp4"' }
          : {}),
      });
      createReadStream(record.path, { start, end }).pipe(res);
      return;
    }
    if (url.pathname.startsWith('/api/')) fail(404, 'Endpoint not found.');
    const staticRoot = resolve(root, 'dist', 'client'),
      requestPath = decodeURIComponent(url.pathname),
      file = resolve(staticRoot, '.' + requestPath);
    if (
      file !== staticRoot &&
      !file.startsWith(staticRoot + '\\') &&
      !file.startsWith(staticRoot + '/')
    )
      fail(403, 'Invalid path.');
    const target =
      existsSync(file) && statSync(file).isFile()
        ? file
        : join(staticRoot, 'index.html');
    if (!existsSync(target))
      fail(
        404,
        'Run the frontend development server on port 3000 or build the app first.',
      );
    const mime =
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
        '.woff2': 'font/woff2',
      }[extname(target)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    createReadStream(target).pipe(res);
  } catch (e) {
    if (!res.headersSent)
      send(res, e.status || 500, {
        error: e.status
          ? e.message
          : 'The operation could not finish. Check the worker log and try again.',
      });
    else res.end();
    if (!e.status) console.error(e.message);
  }
}
async function work() {
  if (rendering) return;
  const job = db.list('job').find((j) => j.status === 'queued');
  if (!job) return;
  rendering = true;
  job.status = 'rendering';
  db.put('job', job);
  milestone(`rendering take ${job.takeNumber} (${job.style})\u2026`);
  try {
    const reserved =
      db.list('upload').reduce((sum, u) => sum + u.size, 0) +
      db
        .list('job')
        .filter((j) => j.path && existsSync(j.path))
        .reduce((sum, j) => sum + statSync(j.path).size, 0);
    if (reserved + job.duration * 8 * 1024 ** 2 > maxStorage)
      throw new Error(
        'Insufficient pilot media budget for this render and its intermediate files.',
      );
    const clips = db
      .list('clip', job.sessionId)
      .filter((c) => job.clipIds.includes(c.id));
    const output = await renderComposition(
      job,
      clips,
      join(data, 'renders', job.id),
      (progress) => {
        job.progress = progress;
        db.put('job', job);
      },
    );
    Object.assign(job, output, {
      status: 'done',
      progress: 100,
      finishedAt: Date.now(),
    });
    db.put('job', job);
    milestone(`render done: take ${job.takeNumber} (${Math.round(job.duration)}s MP4 ready)`);
  } catch (e) {
    console.error('Render failed:', e.message);
    job.status = 'failed';
    job.error =
      'This edit could not be rendered. Check source videos and worker logs, then create another edit.';
    db.put('job', job);
  } finally {
    rendering = false;
    setTimeout(work, 50);
  }
}
// A crash cannot leave a job permanently in progress. Sources and acknowledged uploads survive restart.
for (const j of db.list('job').filter((j) => j.status === 'rendering'))
  db.put('job', { ...j, status: 'queued', progress: 0 });
for (const u of db
  .list('upload')
  .filter((u) => u.status === 'uploading' && existsSync(u.path))) {
  const size = statSync(u.path).size;
  if (size !== u.offset && size <= u.size)
    db.put('upload', { ...u, offset: size });
}
const port = Number(process.env.PORT) || 4100;
const server =
  process.env.TLS_CERT && process.env.TLS_KEY
    ? https.createServer(
        {
          cert: readFileSync(process.env.TLS_CERT),
          key: readFileSync(process.env.TLS_KEY),
        },
        handler,
      )
    : http.createServer(handler);
server.requestTimeout = 120000;
server.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(
    `OurFrame worker: ${process.env.TLS_CERT ? 'https' : 'http'}://localhost:${port}`,
  );
  void work();
});
