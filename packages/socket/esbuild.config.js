import esbuild from "esbuild"
import path from "path"

const shared = {
  bundle: true,
  minify: true,
  platform: "node",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  alias: {
    "@": path.resolve("./src"),
  },
  external: ["firebase-admin"],
}

esbuild.build({
  ...shared,
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.cjs",
})

esbuild.build({
  ...shared,
  entryPoints: ["src/setup.ts"],
  outfile: "dist/setup.cjs",
})
