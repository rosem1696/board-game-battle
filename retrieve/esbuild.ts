import { build, BuildOptions } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import copyStaticFiles from "esbuild-copy-static-files";

const options: BuildOptions = {
  entryPoints: ["src/main.ts"],
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  platform: "node",
  format: "esm",
  bundle: true,
  minify: false,
  plugins: [
    nodeExternalsPlugin(),
    copyStaticFiles({
      src: "./resources",
      dest: "dist/resources/",
      recursive: true,
    }),
  ],
  tsconfig: "./tsconfig.json",
};

async function run() {
  console.log("Running esbuild\n");
  const result = await build(options);
  console.log(result);
  console.log("\nesbuild complete\n");
}

run();
