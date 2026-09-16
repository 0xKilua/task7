import { UploadDropzone } from "@/components/UploadDropzone";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Essayez une nouvelle coiffure, couleur, tenue ou silhouette
        </h1>
        <p className="mt-3 text-neutral-600">
          Importez une photo, choisissez ce que vous voulez essayer, et comparez le resultat a
          l&apos;original. Votre visage et votre identite restent les votres.
        </p>
      </div>

      <UploadDropzone />

      <ol className="mt-10 grid gap-4 text-sm text-neutral-600 sm:grid-cols-4">
        <li className="card">
          <span className="mb-1 block font-semibold text-brand-700">1. Photo</span>
          Importez une photo nette.
        </li>
        <li className="card">
          <span className="mb-1 block font-semibold text-brand-700">2. Module</span>
          Coiffure, couleur, vetements ou silhouette.
        </li>
        <li className="card">
          <span className="mb-1 block font-semibold text-brand-700">3. Generation</span>
          Le moteur applique la transformation.
        </li>
        <li className="card">
          <span className="mb-1 block font-semibold text-brand-700">4. Comparaison</span>
          Avant / apres, sauvegarde, export.
        </li>
      </ol>
    </div>
  );
}
