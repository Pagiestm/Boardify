import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Les plugins sont composés à la main plutôt que repris d'`eslint-config-next`.
 * Celui-ci embarque `eslint-plugin-react`, qui appelle une API retirée par
 * ESLint 10 et interrompt le lint ; il n'en existe aucune version compatible.
 * On garde donc ce qui suit ESLint 10 : les règles Next, React Hooks et
 * TypeScript.
 */
const eslintConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  prettier,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
