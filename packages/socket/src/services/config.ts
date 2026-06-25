import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import fs from "fs"
import { resolve } from "path"
import db from "@rahoot/socket/services/database"

const inContainerPath = process.env.CONFIG_PATH

const getPath = (path: string = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

const toSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

type QuizzRow = { id: string; subject: string; questions: string }

const rowToQuizz = (row: QuizzRow): QuizzWithId => ({
  id: row.id,
  subject: row.subject,
  questions: JSON.parse(row.questions),
})

const exists = (id: string): boolean =>
  db.prepare("SELECT 1 FROM quizzes WHERE id = ?").get(id) !== undefined

class Config {
  static async init() {
    const isConfigFolderExists = fs.existsSync(getPath())

    if (!isConfigFolderExists) {
      fs.mkdirSync(getPath(), { recursive: true })
    }

    const isGameConfigExists = fs.existsSync(getPath("game.json"))

    if (!isGameConfigExists) {
      fs.writeFileSync(
        getPath("game.json"),
        JSON.stringify(
          {
            managerPassword: "PASSWORD",
            music: true,
          },
          null,
          2
        )
      )
    }

    Config.seedFromFiles()
  }

  private static seedFromFiles() {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM quizzes").get() as {
      n: number
    }

    if (n > 0) {
      return
    }

    const quizzDir = getPath("quizz")

    if (!fs.existsSync(quizzDir)) {
      return
    }

    const files = fs
      .readdirSync(quizzDir)
      .filter((file) => file.endsWith(".json"))

    const insert = db.prepare(
      "INSERT OR REPLACE INTO quizzes (id, subject, questions) VALUES (?, ?, ?)"
    )

    for (const file of files) {
      const data = fs.readFileSync(resolve(quizzDir, file), "utf-8")
      const quizz = JSON.parse(data)
      const id = file.replace(".json", "")

      insert.run(id, quizz.subject, JSON.stringify(quizz.questions))
    }

    if (files.length > 0) {
      console.log(`Seeded ${files.length} quizzes into SQLite`)
    }
  }

  static game() {
    const isExists = fs.existsSync(getPath("game.json"))

    if (!isExists) {
      throw new Error("Game config not found")
    }

    try {
      const config = fs.readFileSync(getPath("game.json"), "utf-8")

      return JSON.parse(config)
    } catch (error) {
      console.error("Failed to read game config:", error)
    }

    return {}
  }

  static async quizz(): Promise<QuizzWithId[]> {
    try {
      const rows = db
        .prepare("SELECT id, subject, questions FROM quizzes")
        .all() as QuizzRow[]

      return rows.map(rowToQuizz)
    } catch (error) {
      console.error("Failed to read quizzes:", error)

      return []
    }
  }

  static async getQuizz(id: string): Promise<QuizzWithId | null> {
    try {
      const row = db
        .prepare("SELECT id, subject, questions FROM quizzes WHERE id = ?")
        .get(id) as QuizzRow | undefined

      return row ? rowToQuizz(row) : null
    } catch {
      return null
    }
  }

  static async createQuizz(quizz: Quizz): Promise<QuizzWithId> {
    let id = toSlug(quizz.subject) || `quizz-${Date.now()}`

    if (exists(id)) {
      let suffix = 1

      while (exists(`${id}-${suffix}`)) {
        suffix++
      }

      id = `${id}-${suffix}`
    }

    const { subject, questions } = quizz

    db.prepare(
      "INSERT INTO quizzes (id, subject, questions) VALUES (?, ?, ?)"
    ).run(id, subject, JSON.stringify(questions))

    return { id, subject, questions }
  }

  static async updateQuizz(
    id: string,
    quizz: Quizz,
  ): Promise<QuizzWithId | null> {
    if (!exists(id)) {
      return null
    }

    const { subject, questions } = quizz

    db.prepare(
      "UPDATE quizzes SET subject = ?, questions = ? WHERE id = ?"
    ).run(subject, JSON.stringify(questions), id)

    return { id, subject, questions }
  }

  static async deleteQuizz(id: string): Promise<boolean> {
    const result = db.prepare("DELETE FROM quizzes WHERE id = ?").run(id)

    return result.changes > 0
  }
}

export default Config
