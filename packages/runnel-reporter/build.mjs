import { build } from "esbuild";
import { readFile } from "fs/promises";

(async function () {
  const mod = await readFile("./package.json", "utf8");
  const json = JSON.parse(mod);
  const sharedConfig = {
    entryPoints: ["./src/index.ts", "./src/report-aggregator.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: Object.keys(json.dependencies ?? []),
    platform: "node",
  };

  build({
    ...sharedConfig,
    outdir: "./dist/esm/",
    format: "esm",
  });

  build({
    ...sharedConfig,
    outdir: "./dist/cjs/",
    format: "cjs",
  });
})();
