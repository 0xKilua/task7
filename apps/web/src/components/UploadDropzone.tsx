"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PhotoUploadResult } from "@relook/types";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export function UploadDropzone() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await apiFetch<PhotoUploadResult>("/photos", {
        method: "POST",
        body: form,
        isFormData: true,
      });
      router.push(`/studio/${result.photoId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  if (!loading && !user) {
    return (
      <div className="card border-2 border-dashed border-neutral-300 text-center">
        <p className="mb-4 text-neutral-600">
          Connectez-vous ou creez un compte gratuitement pour importer votre photo et generer vos
          premieres simulations.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/login" className="btn-secondary">
            Connexion
          </a>
          <a href="/register" className="btn-primary">
            Creer un compte
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`card cursor-pointer border-2 border-dashed text-center transition-colors ${
          dragOver ? "border-brand-500 bg-brand-50" : "border-neutral-300"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {uploading ? (
          <p className="text-neutral-600">Envoi et analyse de votre photo...</p>
        ) : (
          <>
            <p className="mb-1 text-lg font-medium">Deposez votre photo ici</p>
            <p className="text-sm text-neutral-500">ou cliquez pour choisir un fichier — JPG, PNG, WEBP, HEIC</p>
          </>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-neutral-500">
        Pour la coiffure et la couleur, une photo ou le visage est bien visible suffit. Pour essayer des
        vetements ou simuler la silhouette, une photo prise de la tete aux pieds donne les meilleurs
        resultats.
      </p>
    </div>
  );
}
