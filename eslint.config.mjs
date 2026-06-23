import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "node_modules/**",
      "**/jest.config.js",
      "eslint.config.mjs"
    ]
  },
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    plugins: {
      react,
      "react-hooks": reactHooks
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off"
    }
  }
);
