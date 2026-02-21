const http = require("http")
const { createSocketServer } = require("./packages/socket/dist/setup.cjs")

const originalListen = http.Server.prototype.listen

http.Server.prototype.listen = function (...args) {
  http.Server.prototype.listen = originalListen

  createSocketServer(this, process.env.WEB_ORIGIN || "*")
  console.log("Socket.IO attached to Next.js server")

  return originalListen.apply(this, args)
}

require("./packages/web/server.js")
