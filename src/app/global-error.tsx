"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/** Dernier recours, quand la mise en page elle-même plante : page minimale sans dépendances. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 20 }}>Quelque chose s&apos;est mal passé</h1>
          <p style={{ color: "#666" }}>Rechargez la page pour réessayer.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
