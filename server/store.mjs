import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function openStore(directory) {
  mkdirSync(directory, { recursive: true });
  const db = new DatabaseSync(resolve(directory, 'ourframe.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, session_id TEXT, data TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE INDEX IF NOT EXISTS records_session ON records(kind,session_id);`);
  return {
    get(kind,id) { const row=db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,id); return row ? JSON.parse(row.data) : null; },
    list(kind,sessionId) { const rows=sessionId ? db.prepare('SELECT data FROM records WHERE kind=? AND session_id=?').all(kind,sessionId) : db.prepare('SELECT data FROM records WHERE kind=?').all(kind); return rows.map(r=>JSON.parse(r.data)); },
    put(kind,value) { db.prepare('INSERT INTO records(kind,id,session_id,data) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET session_id=excluded.session_id,data=excluded.data').run(kind,value.id,value.sessionId||null,JSON.stringify(value)); return value; },
    delete(kind,id) { db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id); },
    close() { db.close(); }
  };
}
