import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import node from "eslint-plugin-n";

export default [
  js.configs.recommended, // Standard JS rules
  tseslint.configs.recommended, // TypeScript rules
  prettier, // Disable conflicting ESLint rules for Prettier compatibility
  {
    languageOptions: {
      parser: tseslint.parser, // TypeScript parser
      parserOptions: {
        ecmaVersion: "latest", // Use latest ECMAScript features
        sourceType: "module", // Enforce ES Modules
        project: "./tsconfig.json", // Ensure TypeScript project config is considered
      },
    },
    plugins: {
      n: node, // Node.js specific rules
    },
    rules: {
      "n/no-unsupported-features/es-syntax": "off", // Allow modern ES syntax
      "n/no-missing-import": "off", // Avoid false positives with TypeScript imports
      "no-console": "warn", // Warn about console.log (not an error)
      "semi": ["error", "always"], // Enforce semicolons
      "quotes": ["error", "double"], // Enforce double quotes
      "indent": ["error", 2], // Enforce 2-space indentation
      "prettier/prettier": "error", // Ensure Prettier formatting
    },
  },
];
