const http = require("http")
const path = require("path")
const { Server: SocketIO } = require("socket.io")
const { setupSocketHandlers } = require("./packages/socket/dist/setup.cjs")

const nextDir = path.join(__dirname, "packages", "web")

process.env.NODE_ENV = "production"

const NextServer =
  require("next/dist/server/next-server").default

const serverConfig = require(
  path.join(nextDir, ".next", "required-server-files.json"),
)

const nextServer = new NextServer({
  hostname: "0.0.0.0",
  port: parseInt(process.env.PORT || "3000"),
  dir: nextDir,
  dev: false,
  customServer: true,
  conf: serverConfig.config,
})

const nextHandler = nextServer.getRequestHandler()

const httpServer = http.createServer((req, res) => {
  nextHandler(req, res)
})

const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.WEB_ORIGIN || "*",
  },
})

setupSocketHandlers(io)

const port = parseInt(process.env.PORT || "3000")

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Rahoot running on port ${port}`)
})
