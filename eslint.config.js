const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    '.expo/*',
    'coverage/*',
    'ios/*',
    'android/*',
    'references/*',
    'node_modules/*',
  ]),
  expoConfig,
  {
    files: ['scripts/**/*.js', 'jest/**/*.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
