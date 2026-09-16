"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, clearTokens } from "@/lib/api-client";

interface Profile {
  email: string;
  displayName: string | null;
  referenceWeightKg: number | null;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [referenceWeightKg, setReferenceWeightKg] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch<Profile>("/account").then((p) => {
      setProfile(p);
      setDisplayName(p.displayName ?? "");
      setReferenceWeightKg(p.referenceWeightKg ? String(p.referenceWeightKg) : "");
    });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/account", {
        method: "PATCH",
        body: {
          displayName: displayName || undefined,
          referenceWeightKg: referenceWeightKg ? Number(referenceWeightKg) : undefined,
        },
      });
      setMessage("Profil mis a jour.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Echec de la mise a jour.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    await apiFetch("/account", { method: "DELETE" });
    clearTokens();
    router.push("/");
  }

  if (!loading && !user) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>Connectez-vous pour gerer votre compte.</p>
        <a href="/login" className="btn-primary mt-4 inline-flex">
          Connexion
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Mon compte</h1>

      {profile && (
        <form onSubmit={save} className="card space-y-4">
          <div>
            <label htmlFor="account-email" className="mb-1 block text-sm font-medium">Email</label>
            <input id="account-email" className="input bg-neutral-100" value={profile.email} disabled />
          </div>
          <div>
            <label htmlFor="account-displayName" className="mb-1 block text-sm font-medium">Prenom</label>
            <input id="account-displayName" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="account-weight" className="mb-1 block text-sm font-medium">Poids de reference (kg)</label>
            <input
              id="account-weight"
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={referenceWeightKg}
              onChange={(e) => setReferenceWeightKg(e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Optionnel : sert uniquement de reference pour le module silhouette. Renseigne par vous,
              jamais deduit automatiquement.
            </p>
          </div>
          {message && <p className="text-sm text-neutral-600">{message}</p>}
          <button className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      <div className="card border border-red-200">
        <h2 className="mb-2 text-sm font-semibold text-red-700">Zone de danger</h2>
        <p className="mb-4 text-sm text-neutral-600">
          La suppression de votre compte efface immediatement et definitivement vos photos, vos
          simulations et vos favoris.
        </p>
        {!confirmingDelete ? (
          <button className="btn-danger" onClick={() => setConfirmingDelete(true)}>
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button className="btn-danger" onClick={deleteAccount}>
              Confirmer la suppression definitive
            </button>
            <button className="btn-secondary" onClick={() => setConfirmingDelete(false)}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
