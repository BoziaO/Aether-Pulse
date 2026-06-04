/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'auto',
  plugins: [],
  overrides: [
    {
      files: ['*.html'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.vue'],
      options: {
        printWidth: 100,
      },
    },
    {
      files: ['*.md'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.json', '*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
}
