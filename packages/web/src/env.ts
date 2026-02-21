import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const env = createEnv({
  server: {
    WEB_ORIGIN: z.string().default("http://localhost:3000"),
    SOCKET_URL: z.string().optional(),
  },

  runtimeEnv: {
    WEB_ORIGIN: process.env.WEB_ORIGIN,
    SOCKET_URL: process.env.SOCKET_URL,
  },
})

export default env
