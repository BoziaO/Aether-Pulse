/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue'],
  },
  plugins: ['@typescript-eslint', 'vue', 'import'],
  settings: {
    'import/resolver': {
      typescript: {},
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'] },
    },
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-redeclare': ['error'],
    '@typescript-eslint/no-use-before-define': ['error'],

    // Vue specific
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-indent': ['error', 2],
    'vue/script-indent': ['error', 2, { baseIndent: 1, switchCase: 1 }],
    'vue/require-prop-types': 'off',
    'vue/require-default-prop': 'off',

    // Standard rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': 'off',
    'no-case-declarations': 'error',
    'no-fallthrough': 'off',
    'default-case': 'off',
    'no-redeclare': 'off',
    'no-use-before-define': 'off',

    // Import order
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'],
          ['internal', 'parent', 'sibling', 'index'],
          ['object', 'type'],
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',

    // Prettier compatibility
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],

    // Security
    'no-inner-html/no-inner-html': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['*.vue'],
      rules: {
        'vue/script-indent': 'off',
      },
    },
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
        'no-debugger': 'off',
      },
    },
    {
      files: ['server/**/*.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'dist-*',
    'build',
    '*.d.ts',
    '.eslintrc.cjs',
    'pnpm-lock.yaml',
    'package.json',
    'docker',
    '.turbo',
  ],
}
