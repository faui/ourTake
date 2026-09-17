import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { run, probe } from '../server/composition.mjs';

mkdirSync('test-output', { recursive: true });
const directory = mkdtempSync(resolve('test-output/run-'));
const port = 4117,
  base = `http://127.0.0.1:${port}`;
let worker = spawn(process.execPath, ['server/index.mjs'], {
  env: {
    ...process.env,
    PORT: String(port),
    OURFRAME_DATA: join(directory, 'db'),
  },
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
worker.stderr.on('data', (d) => (logs += d));
worker.stdout.on('data', (d) => (logs += d));
async function request(path, token, method = 'GET', data, expected = 200) {
  const response = await fetch(base + '/api' + path, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const b = await response.json();
  assert.equal(response.status, expected, JSON.stringify(b));
  return b;
}
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(logs);
}
try {
  await ready();
  const timing = await request('/time');
  assert.ok(timing.sentAt >= timing.receivedAt);
  assert.ok(timing.epoch);
  const host = await request(
    '/sessions',
    null,
    'POST',
    {
      name: 'Integration court',
      sport: 'basketball',
      displayName: 'Host',
      consent: true,
    },
    201,
  );
  const s = host.session.id,
    guest = await request(
      '/join',
      null,
      'POST',
      { invite: host.session.invite, displayName: 'Guest', consent: true },
      201,
    );
  await request(`/sessions/${s}`, null, 'GET', null, 401);
  const snap = await request(`/sessions/${s}`, guest.token);
  assert.equal(snap.invite, undefined);
  assert.equal(snap.members.length, 2);
  assert.ok(!JSON.stringify(snap).includes('tokenHash'));
  await request(
    `/sessions/${s}/control`,
    guest.token,
    'POST',
    { action: 'start' },
    403,
  );
  await request(
    `/sessions/${s}/control`,
    host.token,
    'POST',
    { action: 'start' },
    409,
  );
  await request(`/sessions/${s}/self`, guest.token, 'PATCH', {
    armed: true,
    clockError: 7,
  });
  const start = await request(`/sessions/${s}/control`, host.token, 'POST', {
    action: 'start',
  });
  assert.equal(start.status, 'recording');
  assert.ok(start.startAt > Date.now() + 6000);
  await request(`/sessions/${s}/control`, host.token, 'POST', {
    action: 'stop',
  });
  const fixture = join(directory, 'camera.mp4');
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=640x360:rate=30',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000',
    '-t',
    '5',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    fixture,
  ]);
  const bytes = readFileSync(fixture);
  const u = await request(
    `/sessions/${s}/uploads`,
    guest.token,
    'POST',
    {
      clientId: 'test-fixture-001',
      name: 'Fixture',
      mime: 'video/mp4',
      size: bytes.length,
      startTime: Date.now(),
      clockAnchors:[{sequence:0,elapsedMs:120,offset:3,roundTrip:8,measuredAt:Date.now()}],
    },
    201,
  );
  const duplicate = await request(
    `/sessions/${s}/uploads`,
    guest.token,
    'POST',
    {
      clientId: 'test-fixture-001',
      name: 'Fixture',
      mime: 'video/mp4',
      size: bytes.length,
      startTime: Date.now(),
    },
  );
  assert.equal(duplicate.id, u.id);
  await request(`/uploads/${u.id}`, host.token, 'GET', null, 403);
  const wrong = await fetch(base + `/api/uploads/${u.id}`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + guest.token,
      'X-Upload-Offset': '10',
    },
    body: bytes,
  });
  assert.equal(wrong.status, 409);
  for (let offset = 0; offset < bytes.length; offset += 100000) {
    const chunk = bytes.subarray(offset, offset + 100000);
    const result = await fetch(base + `/api/uploads/${u.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + guest.token,
        'X-Upload-Offset': String(offset),
      },
      body: chunk,
    });
    assert.equal(result.status, 200);
  }
  const c = await request(
    `/uploads/${u.id}/complete`,
    guest.token,
    'POST',
    {},
    201,
  );
  assert.ok(c.duration >= 5);
  assert.equal(c.path, undefined);
  assert.equal(c.clockAnchors[0].evidence,'recorder-callback-clock-estimate');
  // Streaming upload: size unknown at create, chunks relayed during recording,
  // marks and clock anchors delivered at completion.
  const su = await request(
    `/sessions/${s}/uploads`,
    guest.token,
    'POST',
    { clientId: 'test-stream-001', name: 'Streamed', mime: 'video/mp4', startTime: Date.now() },
    201,
  );
  for (let offset = 0; offset < bytes.length; offset += 100000) {
    const chunk = bytes.subarray(offset, offset + 100000);
    const result = await fetch(base + `/api/uploads/${su.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + guest.token,
        'X-Upload-Offset': String(offset),
      },
      body: chunk,
    });
    assert.equal(result.status, 200);
  }
  const sc = await request(
    `/uploads/${su.id}/complete`,
    guest.token,
    'POST',
    {
      marks: [1.5],
      clockAnchors: [
        { sequence: 1, elapsedMs: 500, offset: 2, roundTrip: 9, measuredAt: Date.now() },
      ],
    },
    201,
  );
  assert.ok(sc.duration >= 5);
  assert.equal(sc.marks[0], 1.5);
  assert.equal(sc.clockAnchors[0].evidence, 'recorder-callback-clock-estimate');
  // Download policy: owners and the host may download originals; other
  // participants only after the host opens downloads for everyone.
  const viewer = await request(
    '/join',
    null,
    'POST',
    { invite: host.session.invite, displayName: 'Viewer', consent: true },
    201,
  );
  const viewerClip = (await request(`/sessions/${s}`, viewer.token)).clips.find(
    (x) => x.id === sc.id,
  );
  const ownerClip = (await request(`/sessions/${s}`, guest.token)).clips.find(
    (x) => x.id === sc.id,
  );
  assert.equal((await fetch(base + viewerClip.url)).status, 200);
  assert.equal((await fetch(base + viewerClip.url + '&download=1')).status, 403);
  assert.equal((await fetch(base + ownerClip.url + '&download=1')).status, 200);
  await request(
    `/sessions/${s}/control`,
    viewer.token,
    'POST',
    { action: 'downloads', allowAll: true },
    403,
  );
  await request(`/sessions/${s}/control`, host.token, 'POST', {
    action: 'downloads',
    allowAll: true,
  });
  assert.equal((await fetch(base + viewerClip.url + '&download=1')).status, 200);
  await request(`/sessions/${s}/control`, host.token, 'POST', {
    action: 'downloads',
    allowAll: false,
  });
  assert.equal((await fetch(base + viewerClip.url + '&download=1')).status, 403);
  await request(
    `/sessions/${s}/compose`,
    host.token,
    'POST',
    { style: 'clean', scope: 'person', aspect: 'portrait', duration: 5 },
    409,
  );
  await request(`/clips/${c.id}`, host.token, 'PATCH', {
    tag: { start: 1, end: 4 },
  });
  await request(
    `/clips/${c.id}`,
    host.token,
    'PATCH',
    { tag: { start: 4, end: 1 } },
    400,
  );
  const before = await request(`/sessions/${s}`, host.token);
  const firstUrl = before.clips[0].url;
  assert.equal(
    (await request(`/sessions/${s}`, host.token)).clips[0].url,
    firstUrl,
  );
  assert.equal(
    (await fetch(base + firstUrl, { headers: { Range: 'bytes=0-99' } })).status,
    206,
  );
  assert.equal(
    (await fetch(base + firstUrl.replace('signature=', 'signature=invalid')))
      .status,
    403,
  );
  const jobs = [];
  for (const style of ['clean', 'pulse', 'mono', 'study'])
    jobs.push(
      await request(
        `/sessions/${s}/compose`,
        host.token,
        'POST',
        {
          style,
          scope: style === 'study' ? 'person' : 'all',
          aspect: style === 'clean' ? 'portrait' : 'landscape',
          duration: 5,
        },
        202,
      ),
    );
  const manual = {
    style: 'clean',
    scope: 'all',
    aspect: 'landscape',
    title: 'My chosen moments',
    requestId: 'chosen-moments-test-001',
    entries: [
      { clipId: c.id, start: 2, duration: 1 },
      { clipId: c.id, start: 0, duration: 1 },
    ],
  };
  const chosen = await request(
    `/sessions/${s}/compose`,
    host.token,
    'POST',
    manual,
    202,
  );
  assert.equal(chosen.takeNumber, 5);
  const retry = await request(
    `/sessions/${s}/compose`,
    host.token,
    'POST',
    manual,
    202,
  );
  assert.equal(retry.id, chosen.id);
  assert.equal(retry.takeNumber, 5);
  const duplicateRequests=await Promise.all([request(`/sessions/${s}/compose`,host.token,'POST',manual,202),request(`/sessions/${s}/compose`,host.token,'POST',manual,202)]);assert.ok(duplicateRequests.every(j=>j.id===chosen.id&&j.takeNumber===5));
  await request(
    `/sessions/${s}/compose`,
    host.token,
    'POST',
    {
      ...manual,
      requestId: 'invalid-range-test',
      entries: [{ clipId: c.id, start: 4, duration: 3 }],
    },
    400,
  );
  await request(
    `/sessions/${s}/compose`,
    host.token,
    'POST',
    {
      ...manual,
      requestId: 'foreign-clip-test',
      entries: [{ clipId: 'another-session-clip', start: 0, duration: 1 }],
    },
    400,
  );
  let completed = [];
  for (let i = 0; i < 600; i++) {
    const state = await request(`/sessions/${s}`, host.token);
    if (state.jobs.some((j) => j.status === 'failed'))
      throw new Error('Render failed: ' + logs);
    completed = state.jobs.filter((j) => j.status === 'done');
    if (completed.length === 5) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(completed.length, 5, logs);
  const manualResult = completed.find((j) => j.id === chosen.id);
  assert.equal(manualResult.plan.method, 'chosen-moments');
  assert.deepEqual(
    manualResult.plan.entries.map((e) => e.start),
    [2, 0],
  );
  assert.ok(manualResult.duration >= 1.9 && manualResult.duration <= 2.2);
  const outputs = [];
  for (const j of completed) {
    const response = await fetch(base + j.url);
    assert.equal(response.status, 200);
    const path = join(directory, `take-${j.takeNumber}-${j.style}.mp4`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
    const info = await probe(path);
    assert.equal(info.width, j.aspect === 'portrait' ? 1080 : 1920);
    assert.ok(info.duration > 0 && info.duration < 6);
    outputs.push({
      style: j.style,
      path,
      duration: info.duration,
      width: info.width,
      height: info.height,
    });
  }
  const replacement = await request(
    `/sessions/${s}/rotate-invite`,
    host.token,
    'POST',
    {},
  );
  assert.notEqual(replacement.invite, host.session.invite);
  await request(
    '/join',
    null,
    'POST',
    { invite: host.session.invite, displayName: 'Late', consent: true },
    404,
  );
  // Persisted sessions survive a worker restart.
  worker.kill();
  await new Promise((r) => worker.once('close', r));
  worker = spawn(process.execPath, ['server/index.mjs'], {
    env: {
      ...process.env,
      PORT: String(port),
      OURFRAME_DATA: join(directory, 'db'),
    },
    windowsHide: true,
    stdio: 'ignore',
  });
  await ready();
  assert.equal(
    (await request(`/sessions/${s}`, host.token)).jobs.filter(
      (j) => j.status === 'done',
    ).length,
    5,
  );
  await request(`/sessions/${s}`, guest.token, 'DELETE', null, 403);
  await request(`/sessions/${s}`, host.token, 'DELETE');
  await request(`/sessions/${s}`, host.token, 'GET', null, 404);
  assert.equal((await fetch(base + firstUrl)).status, 404);
  const report = {
    passed: true,
    checks: [
      'membership isolation',
      'host control',
      'scheduled start',
      'resumable upload',
      'idempotent upload',
      'subject tagging',
      'signed media/ranges',
      'stable playback URLs',
      'four recipe outputs plus chosen-moment MP4',
      'validated manual source ranges',
      'stable take numbering and retry identity',
      'four-timestamp clock endpoint',
      'restart persistence',
      'invitation rotation',
      'deletion revokes media',
    ],
    outputs,
  };
  writeFileSync(
    join(directory, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  console.error(e.message);
  writeFileSync(join(directory, 'worker.log'), logs);
  process.exitCode = 1;
} finally {
  worker.kill();
}
