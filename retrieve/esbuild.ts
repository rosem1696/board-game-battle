import {build, BuildOptions} from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals'

const options: BuildOptions = {
  entryPoints: ['src/main.ts'],
  outdir: 'dist',
  outExtension: {'.js':'.mjs'},
  platform: 'node',
  format: 'esm',
  bundle: true,
  minify: false,
  plugins: [nodeExternalsPlugin()],
  tsconfig: './tsconfig.json'
}

async function run() {
  console.log('Running esbuild\n')
  const result = await build(options);  
  console.log(result);
  console.log('\nesbuild complete\n')
}

run();
