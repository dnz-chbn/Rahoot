import { Server } from "@rahoot/common/types/game/socket"
import env from "@rahoot/socket/env"
import { setupSocketHandlers } from "@rahoot/socket/setup"
import { Server as ServerIO } from "socket.io"

const io: Server = new ServerIO({
  cors: {
    origin: [env.WEB_ORIGIN],
  },
})

setupSocketHandlers(io)

const port = env.SOCKER_PORT
console.log(`Socket server running on port ${port}`)
io.listen(Number(port))
