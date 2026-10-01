const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^chore\(release\): /.test(message)],
};

export default config;
