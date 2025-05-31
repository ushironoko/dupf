module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // General rules
    'no-console': 'off', // Allow console in CLI tool
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/'],
};
