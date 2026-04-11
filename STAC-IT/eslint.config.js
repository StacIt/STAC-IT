// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = defineConfig([
  expoConfig,
  reactHooks.configs.flat["recommended-latest"],

  {
    ignores: ["dist/*"],
    rules: {
        '@typescript-eslint/no-unused-vars': ['off', { caughtErrors: 'none', argsIgnorePattern: "^_", varsIgnorePattern: "^_"  }],
        "react/no-unescaped-entities": ["off"]
    }
  }
]);
