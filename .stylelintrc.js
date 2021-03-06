// Config for stylelint parsing CSS in Styled Components
// Note the `--fix` flag doesn't yet work for CSS-in-JS
module.exports = {
  extends: [
    'stylelint-config-palantir',
    'stylelint-config-prettier',
  ],
  rules: {
    'selector-max-id': 1,
    'selector-max-universal': 1,
  },
}
