import process from 'node:process'
import { build } from 'esbuild'

// bundle the server into dist/src/index.js: only workspace TS sources (@psh/shared)
// are inlined — every real dependency stays external so runtime keeps a single
// copy of each package (zod identity, better-sqlite3 native bindings, …).
// the extra src/ level keeps dist at the same depth as the TS sources, so the
// `../../drizzle` and `../../web/dist` import.meta.dirname resolvers still land
build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: true,
  outfile: 'dist/src/index.js',
  plugins: [
    {
      name: 'externalize-deps',
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path === '@psh/shared') {
            return // let esbuild resolve the workspace TS source and bundle it
          }
          return { path: args.path, external: true }
        })
      },
    },
  ],
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
