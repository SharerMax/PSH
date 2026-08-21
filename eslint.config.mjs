// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'app',
    typescript: true,
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/drizzle/**/*.sql',
    ],
  },

  // server: process globals and startup logging are intentional
  {
    files: ['apps/server/src/**/*.ts', 'apps/server/drizzle.config.ts'],
    rules: {
      'node/prefer-global/process': 'off',
      'no-console': 'off',
    },
  },

  // shadcn-generated code: keep as-is, relax stylistic opinions
  {
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'style/no-null-reason': 'off',
      'ts/no-explicit-any': 'off',
    },
  },
)
