"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useJournal } from "@/lib/journal";
import { todayStr } from "@/lib/utils";

export default function JournalBackup() {
  const { entries, exportEntries, importEntries } = useJournal();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function handleExport() {
    const blob = new Blob([exportEntries()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carnet-de-fer-${todayStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: "ok", text: `${entries.length} entrée(s) exportée(s).` });
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = importEntries(await file.text());
      setMessage({
        kind: "ok",
        text: `${result.added} entrée(s) importée(s)${result.skipped ? `, ${result.skipped} ignorée(s) (déjà présentes ou invalides)` : ""}.`,
      });
    } catch (err) {
      setMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "Impossible de lire ce fichier.",
      });
    } finally {
      // Permet de réimporter le même fichier deux fois de suite
      e.target.value = "";
    }
  }

  return (
    <div className="panel backup-panel">
      <h3>💾 Sauvegarde du journal</h3>
      <p>
        Ton journal est stocké dans ce navigateur uniquement. Vider les données du navigateur ou
        changer d&apos;appareil l&apos;effacerait — exporte-le de temps en temps pour le garder.
      </p>
      <div className="backup-actions">
        <button type="button" className="log-submit" onClick={handleExport} disabled={!entries.length}>
          Exporter ({entries.length})
        </button>
        <button type="button" className="log-cancel" onClick={() => fileInput.current?.click()}>
          Importer un fichier
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          hidden
        />
      </div>
      {message && (
        <p className={message.kind === "ok" ? "backup-ok" : "backup-error"} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
}
