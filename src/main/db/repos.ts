import Database from 'better-sqlite3'
import { basename } from 'node:path'
import { getPaths } from '../paths'
import { Repo } from '../../shared/types'

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (db) return db
  db = new Database(getPaths().reposDb)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      added_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  return db
}

export function listRepos(): Repo[] {
  const rows = getDb()
    .prepare('SELECT id, path, name, added_at as addedAt FROM repos ORDER BY added_at DESC')
    .all() as Repo[]
  return rows
}

export function addRepo(path: string): Repo {
  const name = basename(path)
  const stmt = getDb().prepare(
    'INSERT OR IGNORE INTO repos (path, name, added_at) VALUES (?, ?, ?)'
  )
  stmt.run(path, name, Date.now())
  const row = getDb()
    .prepare('SELECT id, path, name, added_at as addedAt FROM repos WHERE path = ?')
    .get(path) as Repo
  return row
}

export function removeRepo(id: number): void {
  getDb().prepare('DELETE FROM repos WHERE id = ?').run(id)
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}
