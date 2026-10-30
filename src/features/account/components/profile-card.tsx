"use client";

import { useRef, useState } from "react";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { CameraIcon, Trash2Icon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  AccountProfile,
  useRemoveAvatar,
  useUpdateEmail,
  useUpdateName,
  useUploadAvatar,
} from "../api/use-account";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const AVATAR_SIZE = 256;

/** Recadre la photo en carré et la réduit, pour un envoi et un affichage légers. */
const resizeAvatar = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("Image illisible");
  return new File([blob], "avatar.webp", { type: blob.type || "image/webp" });
};

export const ProfileCard = ({ profile }: { profile: AccountProfile }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");

  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const { mutate: removeAvatar, isPending: isRemoving } = useRemoveAvatar();
  const { mutate: updateName, isPending: isSavingName } = useUpdateName();
  const { mutate: updateEmail, isPending: isSavingEmail } = useUpdateEmail();

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setAvatarError("Choisissez une image.");
    if (file.size > MAX_AVATAR_SIZE) return setAvatarError("L'image ne doit pas dépasser 2 Mo.");
    setAvatarError(null);
    resizeAvatar(file)
      .then((resized) => uploadAvatar(resized))
      .catch(() => setAvatarError("Cette image ne peut pas être lue."));
  };

  const nameChanged = name.trim() !== profile.name && name.trim().length > 0;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="space-y-1 px-6 pt-6 pb-5">
        <h2 className="text-lg font-semibold tracking-tight">Profil</h2>
        <p className="text-sm text-muted-foreground">
          Votre photo et votre nom sont visibles par les membres de vos espaces.
        </p>
      </div>

      <div className="flex flex-col gap-6 px-6 pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <MemberAvatar
              name={profile.name || profile.email}
              image={profile.avatarUrl}
              className="size-20"
              fallbackClassName="text-2xl"
            />
            {isUploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                <Spinner />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileRef.current?.click()}
              >
                <CameraIcon />
                {profile.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
              </Button>
              {profile.avatarUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isRemoving || isUploading}
                  onClick={() => removeAvatar()}
                  className="text-muted-foreground"
                >
                  <Trash2Icon />
                  Retirer
                </Button>
              )}
            </div>
            <p
              className={avatarError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
            >
              {avatarError ?? "PNG, JPG ou WebP, 2 Mo maximum. Elle est recadrée en carré."}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (nameChanged) updateName(name.trim());
          }}
        >
          <Label htmlFor="account-name">Nom</Label>
          <div className="flex gap-2">
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={128}
              autoComplete="name"
            />
            <Button type="submit" disabled={!nameChanged || isSavingName} className="shrink-0">
              {isSavingName && <Spinner className="text-current" />}
              Enregistrer
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <Label htmlFor="account-email">Adresse e-mail</Label>
          {editingEmail ? (
            <form
              className="flex flex-col gap-3 rounded-lg border p-3"
              onSubmit={(event) => {
                event.preventDefault();
                updateEmail(
                  { email: email.trim(), password },
                  {
                    onSuccess: () => {
                      setEditingEmail(false);
                      setPassword("");
                    },
                  },
                );
              }}
            >
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="nouvelle@adresse.fr"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Mot de passe actuel"
                aria-label="Mot de passe actuel"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingEmail(false);
                    setEmail(profile.email);
                    setPassword("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSavingEmail || !password || !email.trim() || email.trim() === profile.email
                  }
                >
                  {isSavingEmail && <Spinner className="text-current" />}
                  Changer l&apos;adresse
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <Input
                id="account-email"
                value={profile.email}
                readOnly
                className="text-muted-foreground"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={!profile.hasPassword}
                onClick={() => setEditingEmail(true)}
              >
                Modifier
              </Button>
            </div>
          )}
          {!profile.hasPassword && (
            <p className="text-xs text-muted-foreground">
              Définissez d&apos;abord un mot de passe ci-dessous pour pouvoir changer
              d&apos;adresse.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Compte créé le {format(new Date(profile.createdAt), "d MMMM yyyy", { locale: fr })}.
        </p>
      </div>
    </Card>
  );
};
