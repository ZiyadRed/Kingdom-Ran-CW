/* ESLint config for a Vite + React (JSX, no TypeScript) project.
   Uses the classic .eslintrc format to match the installed ESLint 8.57. */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18' } },
  rules: {
    // core.jsx / pages.jsx intentionally co-locate components with shared
    // constants and helpers, so the fast-refresh "components only" rule is noise.
    // The codebase intentionally omits prop-types (small fan project, no TS).
    'react/prop-types': 'off',
    // Unescaped quotes/apostrophes in JSX text are fine for this content-heavy site.
    'react/no-unescaped-entities': 'off',
    // Empty catch blocks are used deliberately to ignore localStorage failures.
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Node-run build scripts and tooling.
      files: ['scripts/**/*.{js,mjs}', '*.config.{js,mjs}', '.eslintrc.cjs'],
      env: { node: true, browser: false },
    },
    {
      // Vitest test files.
      files: ['**/*.test.{js,jsx}'],
      env: { node: true },
    },
  ],
}
