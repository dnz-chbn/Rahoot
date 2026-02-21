import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import fs from "fs"
import { resolve } from "path"

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
  static init() {
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

    const isQuizzExists = fs.existsSync(getPath("quizz"))

    if (!isQuizzExists) {
      fs.mkdirSync(getPath("quizz"))

      fs.writeFileSync(
        getPath("quizz/example.json"),
        JSON.stringify(
          {
            subject: "Example Quizz",
            questions: [
              {
                question: "What is good answer ?",
                answers: ["No", "Good answer", "No", "No"],
                solution: 1,
                cooldown: 5,
                time: 15,
              },
              {
                question: "What is good answer with image ?",
                answers: ["No", "No", "No", "Good answer"],
                image: "https://placehold.co/600x400.png",
                solution: 3,
                cooldown: 5,
                time: 20,
              },
              {
                question: "What is good answer with two answers ?",
                answers: ["Good answer", "No"],
                image: "https://placehold.co/600x400.png",
                solution: 0,
                cooldown: 5,
                time: 20,
              },
            ],
          },
          null,
          2
        )
      )
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

  static quizz() {
    const isExists = fs.existsSync(getPath("quizz"))

    if (!isExists) {
      return []
    }

    try {
      const files = fs
        .readdirSync(getPath("quizz"))
        .filter((file) => file.endsWith(".json"))

      const quizz: QuizzWithId[] = files.map((file) => {
        const data = fs.readFileSync(getPath(`quizz/${file}`), "utf-8")
        const config = JSON.parse(data)

        const id = file.replace(".json", "")

        return {
          id,
          ...config,
        }
      })

      return quizz || []
    } catch (error) {
      console.error("Failed to read quizz config:", error)

      return []
    }
  }

  static getQuizz(id: string): QuizzWithId | null {
    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    try {
      const data = fs.readFileSync(filePath, "utf-8")

      return { id, ...JSON.parse(data) }
    } catch {
      return null
    }
  }

  static createQuizz(quizz: Quizz): QuizzWithId {
    let id = toSlug(quizz.subject)

    if (!id) {
      id = `quizz-${Date.now()}`
    }

    let filePath = getPath(`quizz/${id}.json`)
    let suffix = 1

    while (fs.existsSync(filePath)) {
      id = `${toSlug(quizz.subject)}-${suffix++}`
      filePath = getPath(`quizz/${id}.json`)
    }

    const { subject, questions } = quizz
    fs.writeFileSync(filePath, JSON.stringify({ subject, questions }, null, 2))

    return { id, subject, questions }
  }

  static updateQuizz(id: string, quizz: Quizz): QuizzWithId | null {
    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    const { subject, questions } = quizz
    fs.writeFileSync(filePath, JSON.stringify({ subject, questions }, null, 2))

    return { id, subject, questions }
  }

  static deleteQuizz(id: string): boolean {
    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return false
    }

    fs.unlinkSync(filePath)

    return true
  }
}

export default Config
