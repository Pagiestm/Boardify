import "server-only";

import mjml2html from "mjml";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

/** Envoi par SMTP (SMTP_URL) : Mailpit en local, n'importe quel service SMTP en production. */
const getTransporter = () => {
  if (!transporter) {
    const url = process.env.SMTP_URL;
    if (!url) throw new Error("SMTP_URL manquante : impossible d'envoyer des e-mails");
    transporter = nodemailer.createTransport(url);
  }
  return transporter;
};

/** Compile un modèle MJML en HTML compatible avec les clients de messagerie. */
export const renderMjml = async (source: string) => {
  const { html, errors } = await mjml2html(source, { validationLevel: "soft" });
  if (errors.length > 0) {
    console.warn("[email] MJML :", errors.map((error) => error.message).join(" ; "));
  }
  return html;
};

export interface Email {
  to: string;
  subject: string;
  /** Source MJML du message. */
  mjml: string;
  /** Version texte, pour les clients qui n'affichent pas le HTML. */
  text: string;
}

export const sendEmail = async ({ to, subject, mjml, text }: Email) => {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || "Boardify <no-reply@boardify.app>",
    to,
    subject,
    html: await renderMjml(mjml),
    text,
  });
};
