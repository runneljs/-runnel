import { defineConfig } from "vite";
import fg from "fast-glob";

// https://github.com/vitejs/vite/discussions/1736#discussioncomment-5126923
const entryPoints = ["src/index.ts", "src/bc/index.ts"];
const files = fg.sync(entryPoints, { absolute: true });
const entities = files.map((file) => {
  const [key] = file.match(/(?<=src\/).*$/) || [];
  const keyWithoutExt = key.replace(/\/[^.]*$/, "");
  return [keyWithoutExt, file];
});
const entries = Object.fromEntries(entities);

export default defineConfig({
  build: {
    target: "esnext",
    outdir: "./dist",
    lib: {
      entry: entries,
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const _entryName = entryName.replace(/\.ts$/, "");
        return {
          es: `${_entryName}.js`,
          cjs: `${_entryName}.cjs`,
        }[format];
      },
    },
    minify: "esbuild",
  },
});
