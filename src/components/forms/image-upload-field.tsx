"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 1048576;

interface ImageUploadFieldProps {
  value?: File | string | null;
  onChange: (value: File | string) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}

export const ImageUploadField = ({
  value,
  onChange,
  disabled,
  label,
  hint = "PNG, JPG ou SVG, 1 Mo max",
}: ImageUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => {
    if (value instanceof File) return URL.createObjectURL(value);
    return value || null;
  }, [value]);

  useEffect(() => {
    return () => {
      if (value instanceof File && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [value, previewUrl]);

  const pick = (file?: File) => {
    if (file && file.type.startsWith("image/")) onChange(file);
  };

  const clear = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const tooLarge = value instanceof File && value.size > MAX_SIZE;

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      <input
        className="hidden"
        type="file"
        accept=".jpg, .png, .jpeg, .svg"
        ref={inputRef}
        onChange={(e) => pick(e.target.files?.[0])}
        disabled={disabled}
      />
      <div className="flex items-center gap-4">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {previewUrl ? (
            <Image src={previewUrl} alt={label} fill unoptimized className="object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {previewUrl ? "Changer l'image" : "Importer une image"}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={clear}
                className="text-muted-foreground"
              >
                Retirer
              </Button>
            )}
          </div>
          <p className={cn("text-xs", tooLarge ? "text-destructive" : "text-muted-foreground")}>
            {tooLarge ? "L'image dépasse 1 Mo." : hint}
          </p>
        </div>
      </div>
    </div>
  );
};
