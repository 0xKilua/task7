import { ingererDocumentAction, supprimerDocumentAction } from '@/app/actions';
import { AlerteAVerifier, Bouton, Carte, EtatVide, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';
import { listerDocuments } from '@/lib/search';

export const dynamic = 'force-dynamic';

export default function PageBaseDocumentaire({
  searchParams,
}: {
  searchParams: { succes?: string; erreur?: string };
}) {
  const utilisateur = exigerSession();
  const estAdministrateur = utilisateur.role === 'administrateur';
  const documents = listerDocuments();

  return (
    <>
      <TitrePage
        titre="Base documentaire"
        chapo="Les réponses de l'application sont construites exclusivement à partir des documents ingérés ici. Chaque document conserve sa source et sa date pour permettre la citation."
      />

      {searchParams.succes && (
        <p role="status" className="mb-4 rounded border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {searchParams.succes}
        </p>
      )}
      {searchParams.erreur && (
        <p role="alert" className="mb-4 rounded border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900">
          {searchParams.erreur}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {estAdministrateur ? (
        <Carte titre="Ingérer un document officiel">
          <form action={ingererDocumentAction} className="space-y-3">
            <div>
              <label htmlFor="fichier" className="block text-xs font-medium text-slate-600">
                Fichier (.pdf, .md, .txt) *
              </label>
              <input
                id="fichier"
                name="fichier"
                type="file"
                accept=".pdf,.md,.txt"
                required
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="titre" className="block text-xs font-medium text-slate-600">
                Titre du document
              </label>
              <input
                id="titre"
                name="titre"
                placeholder="Ex. : Guide de la mobilité professionnelle 2026"
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="source" className="block text-xs font-medium text-slate-600">
                  Source institutionnelle
                </label>
                <input
                  id="source"
                  name="source"
                  placeholder="Ex. : DGAFP"
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="datePublication" className="block text-xs font-medium text-slate-600">
                  Date de publication
                </label>
                <input
                  id="datePublication"
                  name="datePublication"
                  placeholder="Ex. : 2026"
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="url" className="block text-xs font-medium text-slate-600">
                URL de la source
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://..."
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="statut" className="block text-xs font-medium text-slate-600">
                Statut du document
              </label>
              <select
                id="statut"
                name="statut"
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              >
                <option value="officiel">Document officiel</option>
                <option value="a_verifier">À vérifier / provisoire</option>
              </select>
            </div>
            <Bouton>Ingérer le document</Bouton>
            <p className="text-xs text-slate-500">
              L&apos;ingestion extrait le texte, le découpe en passages et les indexe. Réutiliser le
              même titre remplace la version précédente.
            </p>
          </form>
        </Carte>
        ) : (
          <Carte titre="Ingérer un document officiel">
            <p className="text-sm text-slate-700">
              La base documentaire est commune à tous les conseillers : seul un administrateur peut
              y ajouter ou en retirer un document. Signalez-lui le document à intégrer.
            </p>
          </Carte>
        )}

        <Carte titre={`Documents ingérés (${documents.length})`}>
          {documents.length === 0 ? (
            <>
              <EtatVide titre="Base documentaire vide" />
              <div className="mt-3">
                <AlerteAVerifier texte="Tant qu'aucun document n'est ingéré, l'assistant et la recherche signalent l'absence de source et ne produisent aucune information réglementaire." />
              </div>
            </>
          ) : (
            <ul className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{doc.titre}</p>
                    <p className="text-xs text-slate-600">
                      {doc.source}
                      {doc.datePublication && ` · publié en ${doc.datePublication}`} ·{' '}
                      {doc.nbPassages} passages
                    </p>
                    <p className="text-xs text-slate-500">
                      Ingéré le {new Date(doc.dateIngestion).toLocaleString('fr-FR')} · statut :{' '}
                      {doc.statut === 'officiel' ? 'officiel' : 'à vérifier'}
                    </p>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-etat-600 underline"
                      >
                        consulter la source
                      </a>
                    )}
                  </div>
                  {estAdministrateur && (
                    <form action={supprimerDocumentAction}>
                      <input type="hidden" name="documentId" value={doc.id} />
                      <Bouton variante="secondaire">Retirer</Bouton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}
