/** @type {import('lint-staged').Config} */
module.exports = {
  '*.{vue,ts,js}': ['prettier --write'],
  '*.{json,css,md,yaml,yml}': ['prettier --write'],
  '*.ts': ['prettier --write'],
}
