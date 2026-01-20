import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

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
      "boundaries": boundaries,
    },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        {
          type: "app",
          pattern: [
            "src/app/**/*",
            "src/pages/**/*",
            "src/main.tsx",
            "src/App.tsx",
            "src/App.css",
            "src/components/AppSidebar.tsx",
            "src/components/MainLayout.tsx",
            "src/components/AppFooter.tsx"
          ],
        },
        {
          type: "feature",
          pattern: [
            "src/margenkalkulator/**/*",
            "src/admin/**/*",
            "src/components/admin-setup/**/*",
            "src/components/calculator/**/*",
            "src/components/customer/**/*",
            "src/components/gamification/**/*",
            "src/components/team/**/*",
            "src/components/time-tracking/**/*",
            "src/components/visits/**/*",
            "src/components/provisions/**/*",
            "src/components/mfa/**/*",
            "src/components/settings/**/*",
            "src/components/admin/**/*"
          ],
        },
        {
          type: "core",
          pattern: [
            "src/lib/**/*",
            "src/hooks/**/*",
            "src/utils/**/*",
            "src/services/**/*",
            "src/integrations/**/*",
            "src/components/ui/**/*",
            "src/components/guards/**/*",
            "src/components/security/**/*",
            "src/components/contexts/**/*",
            "src/contexts/**/*",
            "src/providers/**/*",
            "src/components/*.{tsx,ts}",
          ],
        },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // Disable non-critical rules for library compatibility
      "no-control-regex": "off",
      "no-case-declarations": "off",
      "prefer-const": "warn",

      // Security Rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // Architectural Boundaries
      "boundaries/no-unknown": ["warn"],
      "boundaries/no-private": ["error"],
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["core"],
              disallow: ["feature", "app"],
              message: "Core modules must not depend on Features or App layer",
            },
            {
              from: ["feature"],
              disallow: ["app"],
              message: "Features must not depend on App layer",
            },
          ],
        },
      ],
    },
  },
);
