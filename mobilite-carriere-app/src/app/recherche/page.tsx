import Link from 'next/link';
import {
  AlerteAVerifier,
  BlocCitation,
  Bouton,
  Carte,
  EtatVide,
  MentionRechercheParSens,
  PistesParLeSens,
  TitrePage,
} from '@/components/ui';
import {
  LONGUEUR_REQUETE_MAX,
  baseDocumentaireVide,
  enregistrerRecherche,
  pistesParLeSens,
  rechercherPassages,
} from '@/lib/search';
import { exigerSession } from '@/lib/auth';
import { etatRechercheParSens } from '@/lib/semantique';

export const dynamic = 'force-dynamic';

export default async function PageRecherche(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const utilisateur = await exigerSession();
  const requete = (searchParams.q ?? '').trim();
  const resultats = requete.length > 0 ? await rechercherPassages(requete, 20) : [];
  if (requete.length > 0) enregistrerRecherche(utilisateur.id, requete, resultats.length);
  const vide = baseDocumentaireVide();
  const sens = etatRechercheParSens();
  const pistes = requete.length > 0 && resultats.length === 0 ? await pistesParLeSens(requete) : [];

  return (
    <>
      <TitrePage
        titre="Recherche documentaire"
        chapo="Recherche dans les passages des documents officiels ingérés, par les mots de la question et par leur sens. Chaque résultat indique son document, sa section et sa date."
      />

      <Carte>
        {/* Champ et bouton sur une même ligne, y compris sur téléphone. */}
        <form method="get" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Termes recherchés
          </label>
          <input
            id="q"
            name="q"
            type="search"
            maxLength={LONGUEUR_REQUETE_MAX}
            defaultValue={requete}
            placeholder="Ex. : détachement, compte personnel de formation, bilan de parcours"
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-etat-600 focus:outline-none focus:ring-1 focus:ring-etat-600"
          />
          <Bouton>Rechercher</Bouton>
        </form>
        <div className="mt-2">
          <MentionRechercheParSens etat={sens} administrateur={utilisateur.role === 'administrateur'} />
        </div>
      </Carte>

      {vide && (
        <div className="mt-5">
          <AlerteAVerifier texte="La base documentaire est vide : aucun passage ne peut être retourné tant qu'un document officiel n'a pas été ingéré." />
          <p className="mt-2 text-sm">
            <Link className="text-etat-700 underline" href="/base-documentaire">
              Déposer un document officiel
            </Link>
          </p>
        </div>
      )}

      {requete.length > 0 && !vide && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-slate-600">
            {resultats.length} passage{resultats.length > 1 ? 's' : ''} pertinent
            {resultats.length > 1 ? 's' : ''} pour « {requete} »
          </p>

          {resultats.length === 0 ? (
            <>
              <AlerteAVerifier texte="Aucun passage suffisamment pertinent n'a été trouvé dans les documents ingérés. Information à vérifier auprès de la source institutionnelle compétente ou du conseiller mobilité-carrière." />
              <PistesParLeSens pistes={pistes} />
            </>
          ) : (
            <ul className="space-y-3">
              {resultats.map((citation, index) => (
                <BlocCitation key={citation.passageId} citation={citation} index={index + 1} />
              ))}
            </ul>
          )}
        </div>
      )}

      {requete.length === 0 && !vide && (
        <div className="mt-6">
          <EtatVide titre="Saisissez un terme pour interroger la base documentaire" />
        </div>
      )}
    </>
  );
}
