import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        chrome: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    plugins: {
      svelte,
    },
    rules: {
      ...svelte.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'dev/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      '.husky/**',
    ],
  },
]
