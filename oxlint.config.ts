import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['react', 'typescript'],
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    eqeqeq: 'error',
  },
  ignorePatterns: ['node_modules', 'dist', 'coverage'],
})
