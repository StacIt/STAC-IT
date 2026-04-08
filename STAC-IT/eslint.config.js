// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const reactCompiler = require("eslint-plugin-react-compiler");


module.exports = defineConfig([
  expoConfig,
  reactCompiler.configs.recommended,
  {
    ignores: ["dist/*"],
    rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none', argsIgnorePattern: "^_", varsIgnorePattern: "^_"  }],
        "react/no-unescaped-entities": ["off"]
    }
  }
]);
