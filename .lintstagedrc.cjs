/** @type {import('lint-staged').Config} */
module.exports = {
  '*.{vue,ts,js,tsx,jsx}': ['prettier --write'],
  '*.{json,css,md,yaml,yml}': ['prettier --write'],
  '*.{cjs,mjs}': ['prettier --write'],
  '*.{ts,tsx,js,jsx,vue}': ['eslint --fix'],
}
