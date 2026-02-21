import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import fs from "fs"
import { resolve } from "path"
import db from "@rahoot/socket/services/firestore"

const COLLECTION = "quizzes"

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

class Config {
  static async init() {
    const isConfigFolderExists = fs.existsSync(getPath())

    if (!isConfigFolderExists) {
      fs.mkdirSync(getPath())
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

    if (db) {
      await Config.seedFromFiles()
    }
  }

  private static async seedFromFiles() {
    if (!db) {
      return
    }

    const snapshot = await db.collection(COLLECTION).limit(1).get()

    if (!snapshot.empty) {
      return
    }

    const quizzDir = getPath("quizz")

    if (!fs.existsSync(quizzDir)) {
      return
    }

    const files = fs
      .readdirSync(quizzDir)
      .filter((file) => file.endsWith(".json"))

    for (const file of files) {
      const data = fs.readFileSync(resolve(quizzDir, file), "utf-8")
      const quizz = JSON.parse(data)
      const id = file.replace(".json", "")

      await db.collection(COLLECTION).doc(id).set({
        subject: quizz.subject,
        questions: quizz.questions,
      })
    }

    if (files.length > 0) {
      console.log(`Seeded ${files.length} quizzes into Firestore`)
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
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    try {
      const snapshot = await db.collection(COLLECTION).get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Quizz),
      }))
    } catch (error) {
      console.error("Failed to read quizzes:", error)

      return []
    }
  }

  static async getQuizz(id: string): Promise<QuizzWithId | null> {
    if (!db) {
      return null
    }

    try {
      const doc = await db.collection(COLLECTION).doc(id).get()

      if (!doc.exists) {
        return null
      }

      return { id: doc.id, ...(doc.data() as Quizz) }
    } catch {
      return null
    }
  }

  static async createQuizz(quizz: Quizz): Promise<QuizzWithId> {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    let id = toSlug(quizz.subject) || `quizz-${Date.now()}`

    const existing = await db.collection(COLLECTION).doc(id).get()

    if (existing.exists) {
      let suffix = 1

      while (
        (await db.collection(COLLECTION).doc(`${id}-${suffix}`).get()).exists
      ) {
        suffix++
      }

      id = `${id}-${suffix}`
    }

    const { subject, questions } = quizz
    await db.collection(COLLECTION).doc(id).set({ subject, questions })

    return { id, subject, questions }
  }

  static async updateQuizz(
    id: string,
    quizz: Quizz,
  ): Promise<QuizzWithId | null> {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) {
      return null
    }

    const { subject, questions } = quizz
    await db.collection(COLLECTION).doc(id).set({ subject, questions })

    return { id, subject, questions }
  }

  static async deleteQuizz(id: string): Promise<boolean> {
    if (!db) {
      throw new Error("Firestore not initialized")
    }

    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) {
      return false
    }

    await db.collection(COLLECTION).doc(id).delete()

    return true
  }
}

export default Config
