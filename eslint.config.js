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
      // ============================================
      // REACT HOOKS - Keep only critical rule
      // Disable React Compiler rules (new in v5.2+)
      // ============================================
      "react-hooks/rules-of-hooks": "error",  // Critical - keep as error
      "react-hooks/exhaustive-deps": "off",   // Disable - too many legacy patterns

      // React Compiler Rules (new in react-hooks 5.x) - DISABLE ALL
      // These are experimental and cause too many false positives
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",

      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // ============================================
      // TYPESCRIPT RULES - Disable non-critical
      // ============================================
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // ============================================
      // JSX/REACT Rules - Disable non-critical
      // ============================================
      "react/no-unescaped-entities": "off",
      "no-control-regex": "off",
      "no-case-declarations": "off",
      "prefer-const": "warn",

      // ============================================
      // JSX A11Y - Disable for now (cosmetic)
      // ============================================
      "jsx-a11y/alt-text": "off",

      // ============================================
      // NEXT.JS Rules - Disable (we use Vite, not Next)
      // ============================================
      "@next/next/no-img-element": "off",

      // ============================================
      // IMPORT Rules - Disable cosmetic
      // ============================================
      "import/no-anonymous-default-export": "off",

      // ============================================
      // SECURITY RULES - KEEP AS ERRORS!
      // These remain strict for security
      // ============================================
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",

      // ============================================
      // ARCHITECTURAL BOUNDARIES
      // ============================================
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
