import { Server } from "@rahoot/common/types/game/socket"
import { inviteCodeValidator } from "@rahoot/common/validators/auth"
import { quizzSchema } from "@rahoot/common/validators/quizz"
import Config from "@rahoot/socket/services/config"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"
import { withGame } from "@rahoot/socket/utils/game"
import { Server as ServerIO } from "socket.io"
import type { Server as HttpServer } from "http"

export function createSocketServer(
  httpServer: HttpServer,
  webOrigin: string,
): Server {
  const io: Server = new ServerIO(httpServer, {
    cors: {
      origin: webOrigin || "*",
    },
  })

  setupSocketHandlers(io)

  return io
}

export async function setupSocketHandlers(io: Server) {
  await Config.init()
  const registry = Registry.getInstance()

  io.on("connection", (socket) => {
    console.log(
      `A user connected: socketId: ${socket.id}, clientId: ${socket.handshake.auth.clientId}`,
    )

    socket.on("player:reconnect", ({ gameId }) => {
      const game = registry.getPlayerGame(
        gameId,
        socket.handshake.auth.clientId,
      )

      if (game) {
        game.reconnect(socket)

        return
      }

      socket.emit("game:reset", "Game not found")
    })

    socket.on("manager:reconnect", ({ gameId }) => {
      const game = registry.getManagerGame(
        gameId,
        socket.handshake.auth.clientId,
      )

      if (game) {
        game.reconnect(socket)

        return
      }

      socket.emit("game:reset", "Game expired")
    })

    socket.on("manager:auth", async (password) => {
      try {
        const config = Config.game()

        if (password !== config.managerPassword) {
          socket.emit("manager:errorMessage", "Invalid password")

          return
        }

        const quizzList = await Config.quizz()
        socket.emit("manager:quizzList", quizzList)
      } catch (error) {
        console.error("Failed to read game config:", error)
        socket.emit("manager:errorMessage", "Failed to read game config")
      }
    })

    socket.on("manager:createQuizz", async (quizz) => {
      try {
        const result = quizzSchema.safeParse(quizz)

        if (!result.success) {
          socket.emit("manager:errorMessage", result.error.issues[0].message)

          return
        }

        const created = await Config.createQuizz(result.data)
        socket.emit("manager:quizzCreated", created)
      } catch (error) {
        console.error("Failed to create quizz:", error)
        socket.emit("manager:errorMessage", "Failed to create quizz")
      }
    })

    socket.on("manager:updateQuizz", async ({ id, quizz }) => {
      try {
        const result = quizzSchema.safeParse(quizz)

        if (!result.success) {
          socket.emit("manager:errorMessage", result.error.issues[0].message)

          return
        }

        const updated = await Config.updateQuizz(id, result.data)

        if (!updated) {
          socket.emit("manager:errorMessage", "Quizz not found")

          return
        }

        socket.emit("manager:quizzUpdated", updated)
      } catch (error) {
        console.error("Failed to update quizz:", error)
        socket.emit("manager:errorMessage", "Failed to update quizz")
      }
    })

    socket.on("manager:deleteQuizz", async (id) => {
      try {
        const deleted = await Config.deleteQuizz(id)

        if (!deleted) {
          socket.emit("manager:errorMessage", "Quizz not found")

          return
        }

        socket.emit("manager:quizzDeleted", id)
      } catch (error) {
        console.error("Failed to delete quizz:", error)
        socket.emit("manager:errorMessage", "Failed to delete quizz")
      }
    })

    socket.on("manager:importQuizz", async (json) => {
      try {
        const parsed = JSON.parse(json)
        const result = quizzSchema.safeParse(parsed)

        if (!result.success) {
          socket.emit("manager:errorMessage", result.error.issues[0].message)

          return
        }

        const created = await Config.createQuizz(result.data)
        socket.emit("manager:quizzCreated", created)
      } catch {
        socket.emit("manager:errorMessage", "Invalid JSON format")
      }
    })

    socket.on("game:create", async (quizzId) => {
      const quizzList = await Config.quizz()
      const quizz = quizzList.find((q) => q.id === quizzId)

      if (!quizz) {
        socket.emit("game:errorMessage", "Quizz not found")

        return
      }

      const game = new Game(io, socket, quizz)
      registry.addGame(game)
    })

    socket.on("player:join", (inviteCode) => {
      const result = inviteCodeValidator.safeParse(inviteCode)

      if (result.error) {
        socket.emit("game:errorMessage", result.error.issues[0].message)

        return
      }

      const game = registry.getGameByInviteCode(inviteCode)

      if (!game) {
        socket.emit("game:errorMessage", "Game not found")

        return
      }

      socket.emit("game:successRoom", game.gameId)
    })

    socket.on("player:login", ({ gameId, data }) =>
      withGame(gameId, socket, (game) => game.join(socket, data.username)),
    )

    socket.on("manager:kickPlayer", ({ gameId, playerId }) =>
      withGame(gameId, socket, (game) => game.kickPlayer(socket, playerId)),
    )

    socket.on("manager:startGame", ({ gameId }) =>
      withGame(gameId, socket, (game) => game.start(socket)),
    )

    socket.on("player:selectedAnswer", ({ gameId, data }) =>
      withGame(gameId, socket, (game) =>
        game.selectAnswer(socket, data.answerKey),
      ),
    )

    socket.on("manager:abortQuiz", ({ gameId }) =>
      withGame(gameId, socket, (game) => game.abortRound(socket)),
    )

    socket.on("manager:nextQuestion", ({ gameId }) =>
      withGame(gameId, socket, (game) => game.nextRound(socket)),
    )

    socket.on("manager:showLeaderboard", ({ gameId }) =>
      withGame(gameId, socket, (game) => game.showLeaderboard()),
    )

    socket.on("disconnect", () => {
      console.log(`A user disconnected : ${socket.id}`)

      const managerGame = registry.getGameByManagerSocketId(socket.id)

      if (managerGame) {
        managerGame.manager.connected = false
        registry.markGameAsEmpty(managerGame)

        if (!managerGame.started) {
          console.log("Reset game (manager disconnected)")
          managerGame.abortCooldown()
          io.to(managerGame.gameId).emit("game:reset", "Manager disconnected")
          registry.removeGame(managerGame.gameId)

          return
        }
      }

      const game = registry.getGameByPlayerSocketId(socket.id)

      if (!game) {
        return
      }

      const player = game.players.find((p) => p.id === socket.id)

      if (!player) {
        return
      }

      if (!game.started) {
        game.players = game.players.filter((p) => p.id !== socket.id)

        io.to(game.manager.id).emit("manager:removePlayer", player.id)
        io.to(game.gameId).emit("game:totalPlayers", game.players.length)

        console.log(
          `Removed player ${player.username} from game ${game.gameId}`,
        )

        return
      }

      player.connected = false
      io.to(game.gameId).emit("game:totalPlayers", game.players.length)
    })
  })

  process.on("SIGINT", () => {
    Registry.getInstance().cleanup()
    process.exit(0)
  })

  process.on("SIGTERM", () => {
    Registry.getInstance().cleanup()
    process.exit(0)
  })

  return io
}
