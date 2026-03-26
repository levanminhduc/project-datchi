import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
  entryPoints: [path.resolve(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs', // Changed to CJS for better compatibility with dotenv and other CommonJS modules
  outfile: path.resolve(__dirname, 'dist/index.js'),
  external: [
    '@hono/node-server', // Keep @hono/node-server external as it handles native node modules
    // If you had other large dependencies that you wanted to keep external
    // and install in the final Docker image, you would list them here.
  ],
  sourcemap: true, // For debugging, remove in production
  minify: false, // Not strictly necessary for backend, but can be enabled
  // Allows `process.env` to be accessed at runtime.
  // We are using `dotenv` for this, so esbuild doesn't need to substitute
  // them at build time.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'), // Hardcode NODE_ENV for the bundle
  },
  plugins: [],
}).catch(() => process.exit(1));
