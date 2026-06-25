import { DatabaseSync } from "node:sqlite"
import fs from "fs"
import { resolve } from "path"

// Mutable game data (quizzes) lives in a single SQLite file under DATA_PATH.
// In the container DATA_PATH=/app/data (a bind-mount); in local dev it falls
// back to <repo>/data. The directory is created if missing.
const dataPath = process.env.DATA_PATH || resolve(process.cwd(), "../../data")

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true })
}

const db = new DatabaseSync(resolve(dataPath, "rahoot.db"))

// WAL improves read/write concurrency; safe for a single-process server.
db.exec("PRAGMA journal_mode = WAL")
db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id        TEXT PRIMARY KEY,
    subject   TEXT NOT NULL,
    questions TEXT NOT NULL
  )
`)

export default db
