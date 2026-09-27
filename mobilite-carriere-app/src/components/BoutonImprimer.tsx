'use client';

export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center rounded bg-etat-600 px-3 py-2 text-sm font-medium text-white hover:bg-etat-700 focus:outline-none focus:ring-2 focus:ring-etat-600"
    >
      Imprimer ou enregistrer en PDF
    </button>
  );
}
