import { exchangeEstimate } from './player-model.mjs';
export type Activity =
  | 'basketball'
  | 'squash'
  | 'dance'
  | 'jiujitsu'
  | 'gym'
  | 'pickleball'
  | 'memories';
export type Member = {
  id: string;
  name: string;
  role: string;
  position: string;
  armed: boolean;
  lastSeen: number;
  clockError: number | null;
  captureInfo?: string;
};
export type Clip = {
  id: string;
  ownerId: string;
  name: string;
  duration: number;
  size: number;
  width: number;
  height: number;
  startTime: number;
  clockError?: number | null;
  url: string;
  marks: number[];
  tags: { memberId: string; start: number; end: number }[];
};
export type Job = {
  id: string;
  takeNumber?: number;
  title?: string;
  style: string;
  scope: string;
  status: string;
  progress: number;
  duration: number;
  aspect: string;
  url?: string;
  error?: string;
  plan?: { method: string; duration: number; requestedDuration: number };
};
export type Session = {
  id: string;
  name: string;
  sport: Activity;
  group: string;
  collection: string;
  status: string;
  take: number;
  startAt: number | null;
  stopAt: number | null;
  allowAllDownloads?: boolean;
  armedIds?: string[];
  invite?: string;
  self: Member;
  members: Member[];
  clips: Clip[];
  jobs: Job[];
};
export type Membership = { id: string; name: string; token: string };
export const activities: Record<
  Activity,
  { label: string; hint: string; positions: string[] }
> = {
  basketball: {
    label: 'Basketball',
    hint: 'Keep both baskets and sidelines visible. Start with a steady overview; add diagonal angles outside the playing boundary.',
    positions: [
      'overview',
      'front-left',
      'front-right',
      'back-left',
      'back-right',
      'low-front',
      'low-back',
    ],
  },
  squash: {
    label: 'Squash',
    hint: 'Start behind the back glass with the front wall and both players visible. Keep cameras clear of the court and door.',
    positions: ['back-center', 'back-left', 'back-right'],
  },
  dance: {
    label: 'Dance',
    hint: 'Fit every dancer head to toe, with room for travel. Keep one front view and add diagonals for depth.',
    positions: [
      'front-center',
      'front-left',
      'front-right',
      'side-left',
      'side-right',
    ],
  },
  jiujitsu: {
    label: 'Jiu-jitsu',
    hint: 'Keep the entire practice pair visible. Place cameras beyond the mat boundary at two complementary angles.',
    positions: [
      'overview',
      'front-left',
      'front-right',
      'back-left',
      'back-right',
    ],
  },
  gym: {
    label: 'Gym / strength',
    hint: 'Frame the full movement and equipment. A side view and a front diagonal are useful for a coach to review.',
    positions: ['side-left', 'front-left', 'front-right', 'side-right'],
  },
  pickleball: {
    label: 'Pickleball',
    hint: 'Show the full court from behind the baseline. Add a diagonal outside the run-off area.',
    positions: [
      'back-center',
      'back-left',
      'back-right',
      'front-left',
      'front-right',
    ],
  },
  memories: {
    label: 'Shared moments',
    hint: 'Choose the perspective you want to contribute. Different places can join the same session; no shared geometry is needed.',
    positions: ['overview', 'people', 'details', 'another-location'],
  },
};
export const styles = [
  {
    id: 'clean',
    name: 'Original',
    caption: 'Natural color · measured cuts',
    swatch: 'clean',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    caption: 'Short cuts · vivid color',
    swatch: 'pulse',
  },
  {
    id: 'mono',
    name: 'Noir',
    caption: 'Black & white · crisp contrast',
    swatch: 'mono',
  },
  {
    id: 'study',
    name: 'Study',
    caption: 'Longer takes · full context',
    swatch: 'study',
  },
];
const base = () =>
  ((import.meta as any).env?.VITE_OURFRAME_API_URL || '').replace(/\/$/, '');
export function mediaUrl(path: string) {
  return path.startsWith('/') ? base() + path : path;
}
export async function api(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(base() + '/api' + path, {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal,
  });
  let value: any;
  try {
    value = await response.json();
  } catch {
    throw new Error(
      'The ourTake session service is unavailable. Start the local service or check its configured address.',
    );
  }
  if (!response.ok)
    throw Object.assign(
      new Error(value.error || 'This request could not finish.'),
      { status: response.status },
    );
  return value;
}
export type Clock = {
  offset: number;
  error: number;
  measuredAt: number;
  roundTrip: number;
  epoch?: string;
};
export async function syncClock(): Promise<Clock> {
  const samples: Clock[] = [];
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 12000);
  try {
    for (let i = 0; i < 7; i++) {
      const before = performance.timeOrigin + performance.now();
      const { serverTime, receivedAt, sentAt, epoch } = await api(
        '/time',
        undefined,
        'GET',
        undefined,
        controller.signal,
      );
      const after = performance.timeOrigin + performance.now();
      samples.push({
        ...exchangeEstimate(
          before,
          receivedAt ?? serverTime,
          sentAt ?? serverTime,
          after,
        ),
        measuredAt: Date.now(),
        epoch,
      });
    }
  } finally {
    clearTimeout(timeout);
  }
  if (samples.some((s) => s.epoch !== samples[0].epoch))
    throw new Error('The session clock restarted. Measure timing again.');
  return samples.sort((a, b) => a.error - b.error)[0];
}
export function sessionNow(clock: Clock | null) {
  return performance.timeOrigin + performance.now() + (clock?.offset || 0);
}
export function saveMembership(value: Membership) {
  const existing = readMemberships().filter((m) => m.id !== value.id);
  localStorage.setItem(
    'ourframe.memberships',
    JSON.stringify([value, ...existing].slice(0, 30)),
  );
}
export function readMemberships(): Membership[] {
  try {
    return JSON.parse(localStorage.getItem('ourframe.memberships') || '[]');
  } catch {
    return [];
  }
}
export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
export function formatSize(size: number) {
  return size > 1024 ** 3
    ? `${(size / 1024 ** 3).toFixed(1)} GB`
    : `${(size / 1024 ** 2).toFixed(1)} MB`;
}

export type ClockAnchor = {
  sequence: number;
  elapsedMs: number;
  offset: number;
  roundTrip: number;
  measuredAt: number;
  evidence: 'recorder-callback-clock-estimate';
};
export type Draft = {
  id: string;
  sessionId: string;
  name: string;
  mime: string;
  startTime: number;
  clockError: number | null;
  clockAnchors?: ClockAnchor[];
  marks: number[];
  createdAt: number;
  complete: boolean;
  uploadId?: string;
  bytes?: number;
};
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ourframe-capture', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('drafts', { keyPath: 'id' });
      request.result.createObjectStore('chunks', {
        keyPath: ['draftId', 'index'],
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function operation(
  store: string,
  mode: IDBTransactionMode,
  callback: (s: IDBObjectStore) => IDBRequest,
) {
  const db = await database();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(store, mode),
      request = callback(tx.objectStore(store));
    let value: any;
    request.onsuccess = () => {
      value = request.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(
        tx.error || new Error('Local storage transaction was interrupted.'),
      );
    };
  });
}
export const saveDraft = (draft: Draft) =>
  operation('drafts', 'readwrite', (s) => s.put(draft));
export const listDrafts = () =>
  operation('drafts', 'readonly', (s) => s.getAll()) as Promise<Draft[]>;
export const saveChunk = (id: string, index: number, blob: Blob) =>
  operation('chunks', 'readwrite', (s) => s.put({ draftId: id, index, blob }));
export async function draftBlob(draft: Draft) {
  const chunks = await operation('chunks', 'readonly', (s) =>
    s.getAll(
      IDBKeyRange.bound([draft.id, 0], [draft.id, Number.MAX_SAFE_INTEGER]),
    ),
  );
  return new Blob(
    chunks.sort((a: any, b: any) => a.index - b.index).map((c: any) => c.blob),
    { type: draft.mime },
  );
}
export async function removeDraft(id: string) {
  await operation('chunks', 'readwrite', (s) =>
    s.delete(IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER])),
  );
  await operation('drafts', 'readwrite', (s) => s.delete(id));
}
export async function uploadDraft(
  draft: Draft,
  token: string,
  onProgress: (v: number) => void,
) {
  const blob = await draftBlob(draft);
  if (!blob.size) throw new Error('No recorded video was saved in this take.');
  const upload = await api(
    `/sessions/${draft.sessionId}/uploads`,
    token,
    'POST',
    {
      clientId: draft.id,
      name: draft.name,
      mime: draft.mime,
      size: blob.size,
      startTime: draft.startTime,
      clockError: draft.clockError,
      clockAnchors: draft.clockAnchors,
      marks: draft.marks,
    },
  );
  draft.uploadId = upload.id;
  await saveDraft(draft);
  let offset = upload.offset,
    retries = 0;
  while (offset < blob.size) {
    try {
      const res = await fetch(base() + `/api/uploads/${upload.id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/octet-stream',
          'X-Upload-Offset': String(offset),
        },
        body: blob.slice(offset, offset + 2 * 1024 ** 2),
      });
      const result = (await res.json()) as { error?: string; offset: number };
      if (!res.ok) throw new Error(result.error);
      offset = result.offset;
      onProgress(Math.round((offset / blob.size) * 100));
      retries = 0;
    } catch (e) {
      if (++retries > 3) throw e;
      await new Promise((r) => setTimeout(r, 600 * retries));
      offset = (await api(`/uploads/${upload.id}`, token)).offset;
    }
  }
  await api(`/uploads/${upload.id}/complete`, token, 'POST', {});
  return upload.id;
}

// Live upload: relay recorder chunks to the worker while recording continues,
// so footage reaches the host during the take instead of afterwards. The
// IndexedDB spool remains the source of truth: on any failure this uploader
// goes quiet and the ordinary uploadDraft path resumes from the server's
// acknowledged offset (uploads are idempotent by clientId).
export function startLiveUpload(draft: Draft, token: string) {
  let uploadId = '',
    offset = 0,
    dead = false;
  let chain: Promise<void> = api(
    `/sessions/${draft.sessionId}/uploads`,
    token,
    'POST',
    {
      clientId: draft.id,
      name: draft.name,
      mime: draft.mime,
      startTime: draft.startTime,
      clockError: draft.clockError,
    },
  ).then((u) => {
    uploadId = u.id;
    offset = u.offset;
  });
  async function put(part: ArrayBuffer) {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(base() + `/api/uploads/${uploadId}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/octet-stream',
          'X-Upload-Offset': String(offset),
        },
        body: part,
      });
      const result = (await res.json()) as { error?: string; offset: number };
      if (res.ok) {
        offset = result.offset;
        return;
      }
      if (attempt >= 1) throw new Error(result.error);
      offset = (await api(`/uploads/${uploadId}`, token)).offset;
    }
  }
  return {
    get dead() {
      return dead;
    },
    append(blob: Blob) {
      if (dead) return;
      chain = chain
        .then(async () => {
          const bytes = await blob.arrayBuffer();
          for (let o = 0; o < bytes.byteLength; o += 2 * 1024 ** 2)
            await put(bytes.slice(o, o + 2 * 1024 ** 2));
        })
        .catch(() => {
          dead = true;
        });
    },
    async finish(marks: number[], clockAnchors: Draft['clockAnchors']) {
      await chain;
      if (dead || !uploadId)
        throw new Error('Live upload fell behind; the saved take will upload normally.');
      await api(`/uploads/${uploadId}/complete`, token, 'POST', {
        marks,
        clockAnchors,
      });
      return uploadId;
    },
  };
}
