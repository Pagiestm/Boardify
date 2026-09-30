/**
 * semantic-release lit ces messages pour décider de la version publiée :
 * un commit hors convention passe inaperçu et la release est simplement omise.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => /^chore\(release\): /.test(message)],
};

export default config;
