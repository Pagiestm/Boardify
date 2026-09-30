import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
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
