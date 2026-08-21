// @ts-check
import antfu from '@antfu/eslint-config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactRefresh from 'eslint-plugin-react-refresh'

export default antfu(
  {
    type: 'app',
    react: true,
    typescript: true,
    formatters: true,
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/drizzle/**/*.sql',
    ],
  },

  // react-router library-mode files and vite configs rely on side-effect/default exports
  {
    files: ['**/vite.config.*', '**/*.config.*'],
    rules: {
      'antfu/top-level-function': 'off',
    },
  },

  // a11y + react-refresh for the web app
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // shiki returns pre-rendered HTML for syntax highlighting
      'react/dom-no-dangerously-set-innerhtml': 'off',
    },
  },

  // shadcn-generated code: keep as-is, relax stylistic opinions
  {
    files: ['apps/web/src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'style/no-null-reason': 'off',
      'ts/no-explicit-any': 'off',
      'eslint-react/no-spreading-props': 'off',
      'react-refresh/only-export-components': 'off',
      // Base UI Label associates controls at runtime via context
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },

  // server: process globals and startup logging are intentional
  {
    files: ['apps/server/src/**/*.ts', 'apps/server/drizzle.config.ts'],
    rules: {
      'node/prefer-global/process': 'off',
      'no-console': 'off',
    },
  },
)
