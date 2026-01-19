import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".next", "node_modules", "build", "src/.next", "supabase/functions"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", // TODO: Enable and fix in Phase 12
      "@typescript-eslint/ban-ts-comment": "off", // TODO: Enable and fix in Phase 12
      "@typescript-eslint/no-empty-object-type": "off", // TODO: Enable and fix in Phase 12

      // Disable non-critical rules for library compatibility
      "no-control-regex": "off", // Library regex patterns
      "no-case-declarations": "off", // Switch statement declarations
      "prefer-const": "warn", // Downgrade to warning

      // Security Rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
    },
  },
);
