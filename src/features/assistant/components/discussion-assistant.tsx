"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCwIcon, SquareIcon } from "lucide-react";

import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useAssistantStream } from "../api/use-assistant";
import { SummaryText } from "./summary-dialog";

/** Résumé de la discussion d'une tâche, affiché en direct dans la carte « Activité ». */
export const DiscussionSummary = ({ taskId, onClose }: { taskId: string; onClose: () => void }) => {
  const { text, isStreaming, start, stop } = useAssistantStream();

  const generate = () => start(`/api/assistant/tasks/${taskId}/discussion`, { mode: "summary" });

  useEffect(() => {
    generate();
    // Résume la discussion à l'ouverture uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      {text ? (
        <SummaryText text={text} />
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {isStreaming && <Spinner />}
          {isStreaming ? "Lecture de la discussion…" : "Aucun résumé."}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
        {isStreaming ? (
          <Button size="sm" variant="outline" onClick={stop}>
            <SquareIcon />
            Arrêter
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={generate}>
            <RefreshCwIcon />
            Régénérer
          </Button>
        )}
      </div>
    </div>
  );
};

/** Propose une réponse au dernier commentaire de la tâche. */
export const suggestReply = async (taskId: string) => {
  const response = await client.api.assistant.tasks[":taskId"].discussion.$post({
    param: { taskId },
    json: { mode: "reply" },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { text: string };
    error?: string;
  } | null;
  if (!response.ok || !body?.data) {
    toast.error(body?.error ?? "L'assistant n'a pas pu répondre");
    return null;
  }
  return body.data.text;
};
