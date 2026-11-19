// Lint (L0), second step after the type-check. Three jobs:
//   1. the recommended correctness rules, with type information, so a
//      promise nobody awaits or a misused one fails here and not in the app;
//   2. the code-size limits from ARCHITECTURE.md, so a module that has grown
//      past them is split in the slice that grew it;
//   3. nothing stylistic. Formatting is not a lint failure in this project.
// A limit is raised only by an ADR that says why, never by a disable comment.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const SIZE_LIMITS = {
  "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true }],
  "max-depth": ["error", 4],
  "max-params": ["error", 5],
  complexity: ["error", 15],
};

export default tseslint.config(
  {
    ignores: [
      "out/**", "dist/**", "release/**", "artifacts/**", "test-results/**",
      "playwright-report/**", "node_modules/**", ".agents/**", ".claude/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ["*.config.ts"] }, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      ...SIZE_LIMITS,
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      // An adapter may be async to satisfy its interface without awaiting.
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "as", objectLiteralTypeAssertions: "never" }],
    },
  },
  {
    // A describe block holds a whole suite, so the function limit would only
    // measure how many tests a file has. The file limit still applies.
    files: ["tests/**/*.ts"],
    // Assertions on parsed output and DOM lookups are loosely typed by nature.
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
    rules: SIZE_LIMITS,
  },
);
