import type { Email } from "../index";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

/** Lien de réinitialisation du mot de passe, valable une heure. */
export const resetPasswordEmail = ({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}): Email => {
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : "Bonjour,";
  const link = escapeHtml(url);

  return {
    to,
    subject: "Réinitialiser votre mot de passe Boardify",
    text: [
      name ? `Bonjour ${name},` : "Bonjour,",
      "",
      "Vous avez demandé à réinitialiser votre mot de passe Boardify. Ouvrez ce lien pour en choisir un nouveau (il est valable une heure) :",
      url,
      "",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.",
    ].join("\n"),
    mjml: `
<mjml lang="fr">
  <mj-head>
    <mj-title>Réinitialiser votre mot de passe</mj-title>
    <mj-attributes>
      <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" />
      <mj-text font-size="15px" line-height="1.6" color="#27272a" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f5">
    <mj-section padding="32px 16px 8px">
      <mj-column>
        <mj-text align="center" font-size="20px" font-weight="700" color="#16804a">Boardify</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" border-radius="12px" padding="24px 16px">
      <mj-column>
        <mj-text>${greeting}</mj-text>
        <mj-text>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton pour en choisir un nouveau.</mj-text>
        <mj-button href="${link}" background-color="#16804a" border-radius="8px" font-size="15px" font-weight="600" padding="16px 0">
          Choisir un nouveau mot de passe
        </mj-button>
        <mj-text font-size="13px" color="#71717a">Ce lien est valable une heure. Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br /><a href="${link}" style="color:#16804a;word-break:break-all">${link}</a></mj-text>
        <mj-divider border-width="1px" border-color="#e4e4e7" />
        <mj-text font-size="13px" color="#71717a">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
  };
};
