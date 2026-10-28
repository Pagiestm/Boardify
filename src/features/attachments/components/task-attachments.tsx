"use client";

import { useRef, useState } from "react";
import { DownloadIcon, FileIcon, PaperclipIcon, Trash2Icon } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { MemberRole } from "@/features/members/types";
import { useGetMembers } from "@/features/members/api/use-get-members";

import { cn } from "@/lib/utils";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/hooks/use-confirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useDeleteAttachment,
  useGetAttachments,
  useUploadAttachment,
} from "../api/use-attachments";

const formatSize = (size: number) => {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
};

interface TaskAttachmentsProps {
  taskId: string;
  workspaceId: string;
}

export const TaskAttachments = ({ taskId, workspaceId }: TaskAttachmentsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { data: current } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });
  const { data: attachments } = useGetAttachments({ taskId });
  const { mutate: upload, isPending: isUploading } = useUploadAttachment();
  const { mutate: remove } = useDeleteAttachment();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer la pièce jointe",
    "Le fichier sera définitivement supprimé.",
    "destructive",
  );

  const memberList = members?.documents ?? [];
  const currentMember = memberList.find((member) => member.userId === current?.$id);
  const memberName = (id: string) => memberList.find((member) => member.$id === id)?.name ?? "";

  const uploadFiles = (files: FileList | null) => {
    Array.from(files ?? []).forEach((file) => upload({ taskId, file }));
  };

  return (
    <Card
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        uploadFiles(event.dataTransfer.files);
      }}
      className={cn(isDragging && "ring-2 ring-primary")}
    >
      <DeleteDialog />
      <CardHeader className="flex-row items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Pièces jointes</CardTitle>
        <Button
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Spinner /> : <PaperclipIcon />}
          Ajouter
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </CardHeader>
      <CardContent className="py-3">
        {!attachments?.length ? (
          <p className="py-2 text-sm text-muted-foreground">
            Glissez des fichiers ici ou cliquez sur « Ajouter » (10 Mo maximum).
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((attachment) => {
              const url = `/api/attachments/${attachment.$id}/file`;
              const isImage = attachment.mimeType?.startsWith("image/");
              const canDelete =
                attachment.memberId === currentMember?.$id ||
                currentMember?.role === MemberRole.ADMIN;

              return (
                <li key={attachment.$id} className="group flex items-center gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted"
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="size-full object-cover" />
                    ) : (
                      <FileIcon className="size-4 text-muted-foreground" />
                    )}
                  </a>
                  <div className="min-w-0 flex-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {attachment.name}
                    </a>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatSize(attachment.size)} · {memberName(attachment.memberId)} ·{" "}
                      <TimeAgo date={attachment.$createdAt} />
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm" asChild aria-label="Télécharger">
                    <a href={`${url}?download=1`}>
                      <DownloadIcon />
                    </a>
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Supprimer ${attachment.name}`}
                      onClick={async () => {
                        if (await confirmDelete()) remove(attachment.$id);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
