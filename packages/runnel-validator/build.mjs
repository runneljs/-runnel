import { build } from "esbuild";
import { readFile } from "fs/promises";

(async function () {
  const mod = await readFile("./package.json", "utf8");
  const json = JSON.parse(mod);
  const sharedConfig = {
    entryPoints: ["./src/index.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: Object.keys(json.dependencies ?? []),
  };

  build({
    ...sharedConfig,
    outfile: "./dist/index.js",
    format: "esm",
  });

  build({
    ...sharedConfig,
    outfile: "./dist/index.cjs",
    format: "cjs",
  });
})();
