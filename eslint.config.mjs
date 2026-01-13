// eslint.config.mjs
import globals from "globals";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";

import prettierConfigPackage from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import node from "eslint-plugin-n";

// Destructure and remove the "extends" property from each imported config
const { extends: omit1, ...jsConfig } = js.configs.recommended;
const { extends: omit2, ...tsConfig } = tsPlugin.configs.recommended;
const { extends: omit3, ...prettierConfig } = prettierConfigPackage;

export default [
  // Ignore migrations and eslint.config.mjs files
  {
    ignores: [
      "eslint.config.mjs",
      "src/migrations/**/*.cjs",
      "dist/**",
      "coverage/**",
    ],
  },
  // Register the @typescript-eslint plugin so its rules can be used
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
  },
  // Register the prettier plugin so its rules can be used
  {
    plugins: {
      prettier: prettierPlugin,
    },
  },
  jsConfig, // Standard JS rules (flat version)
  tsConfig, // TypeScript rules (flat version)
  prettierConfig, // Prettier config without the extends key
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    languageOptions: {
      parser: tsParser, // Use the correct TypeScript parser
      parserOptions: {
        ecmaVersion: "latest", // Use latest ECMAScript features
        sourceType: "module", // Enforce ES Modules
        project: "./tsconfig.eslint.json", // Use expanded TS project for linting
      },
      globals: {
        ...globals.node, // Provide Node globals like process, Buffer, console
      },
    },
    plugins: {
      n: node, // Node.js specific rules
    },
    rules: {
      "n/no-unsupported-features/es-syntax": "off", // Allow modern ES syntax
      "n/no-missing-import": "off", // Avoid false positives with TS imports
      "no-console": "warn", // Warn about console.log (not an error)
      semi: ["error", "always"], // Enforce semicolons
      quotes: ["error", "double", { avoidEscape: true }], // Prefer double quotes but avoid needless escaping
      indent: "off", // Delegate indentation entirely to Prettier
      "prettier/prettier": "error", // Ensure Prettier formatting
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "src/services/**",
                "services/**",
                "@services/**",
                "../services/**",
                "../../services/**",
                "../../../services/**",
                "../../../../services/**",
              ],
              message:
                "Legacy services have been replaced by feature slices. Add code to the owning feature (domain/application/infrastructure) instead of importing from src/services.",
            },
            {
              group: [
                "src/routes/**",
                "routes/**",
                "@routes/**",
                "../routes/**",
                "../../routes/**",
                "../../../routes/**",
                "../../../../routes/**",
              ],
              message:
                "Feature slices now own their HTTP routers. Import routers from the appropriate feature entrypoint instead of src/routes.",
            },
            {
              group: [
                "src/controllers/**",
                "controllers/**",
                "@controllers/**",
                "../controllers/**",
                "../../controllers/**",
                "../../../controllers/**",
                "../../../../controllers/**",
              ],
              message:
                "Legacy controllers have been replaced by feature adapters. Import handlers from the owning feature instead of src/controllers.",
            },
          ],
        },
      ],
    },
  },
  // Override for Jest-driven test files living under __tests__
  {
    files: ["__tests__/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Tests frequently rely on loose mocks
      "@typescript-eslint/no-unused-vars": "off", // Allow descriptive helper/mocked signatures
      "@typescript-eslint/no-require-imports": "off", // Allow jest.mock requires inside tests
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Use withTestEnv/getEnv helpers instead of mutating process.env directly in tests.",
        },
      ],
    },
  },
  // Jest setup files live at repo root but still need Jest globals
  {
    files: ["jest.setup*.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  // Override for CommonJS files (migrations, config files)
  {
    files: ["*.cjs", "src/config/**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node, // Import Node globals (process, __dirname, etc.)
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  // Override for config.cjs file that used for Sequelize configuration
  {
    files: ["src/config/config.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off", // Allow console logs in this specific file
      "prettier/prettier": "off", // File relies on CommonJS formatting, skip Prettier noise
    },
  },
];
