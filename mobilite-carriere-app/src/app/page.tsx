import { compterDispositifs } from '@/lib/dispositifs';
import { bilansEnCours, listerDossiers, statistiques } from '@/lib/dossiers';
import { listerDocuments, recherchesRecentes } from '@/lib/search';
import { Carte, EtatVide, LienBouton, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TableauDeBord() {
  const utilisateur = exigerSession();
  const stats = statistiques(utilisateur.id);
  const dossiers = listerDossiers(utilisateur.id, 6);
  const documents = listerDocuments();
  const recherches = recherchesRecentes(utilisateur.id, 5);
  const bilans = bilansEnCours(utilisateur.id);
  const dispositifs = compterDispositifs();

  return (
    <>
      <TitrePage
        titre="Tableau de bord"
        chapo="Accès rapide aux accompagnements en cours, à la documentation officielle et aux outils d'appui à l'entretien."
      />

      {stats.documents === 0 && (
        <div
          role="status"
          className="mb-6 rounded border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">Base documentaire vide</p>
          <p className="mt-1">
            Aucun document officiel n&apos;est ingéré. L&apos;assistant et la recherche ne peuvent
            produire aucune information sourcée et renverront le message de vérification
            institutionnelle.{' '}
            <Link className="underline" href="/base-documentaire">
              Alimenter la base documentaire
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicateur libelle="Accompagnements" valeur={stats.dossiers} href="/dossiers" />
        <Indicateur libelle="Bilans réalisés" valeur={stats.bilans} href="/dossiers" />
        <Indicateur
          libelle="Documents ingérés"
          valeur={stats.documents}
          href="/base-documentaire"
          complement={`${stats.passages} passages indexés`}
        />
        <Indicateur
          libelle="Dispositifs au catalogue"
          valeur={dispositifs.total}
          href="/dispositifs"
          complement={`${dispositifs.documentes} documentés depuis une source`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Démarrer">
          <div className="flex flex-col gap-2">
            <LienBouton href="/dossiers?nouveau=1">Nouvel accompagnement</LienBouton>
            <LienBouton href="/assistant" variante="secondaire">
              Interroger l&apos;assistant
            </LienBouton>
            <LienBouton href="/entretien" variante="secondaire">
              Préparer un entretien
            </LienBouton>
            <LienBouton href="/dispositifs" variante="secondaire">
              Explorer les dispositifs
            </LienBouton>
          </div>
        </Carte>

        <Carte titre="Dossiers récents">
          {dossiers.length === 0 ? (
            <EtatVide titre="Aucun accompagnement enregistré">
              Créez un dossier pour conserver une trace structurée des éléments utiles.
            </EtatVide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dossiers.map((dossier) => (
                <li key={dossier.id} className="py-2">
                  <Link
                    href={`/dossiers/${dossier.id}`}
                    className="text-sm font-medium text-etat-700 underline"
                  >
                    {dossier.reference}
                  </Link>
                  {dossier.intitule && (
                    <p className="text-xs text-slate-600">{dossier.intitule}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Mis à jour le {formaterDate(dossier.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Bilans en cours">
          {bilans.length === 0 ? (
            <EtatVide titre="Aucun bilan enregistré" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {bilans.map((bilan) => (
                <li key={`${bilan.dossier.id}-${bilan.createdAt}`} className="py-2 text-sm">
                  <Link
                    href={`/dossiers/${bilan.dossier.id}`}
                    className="font-medium text-etat-700 underline"
                  >
                    {bilan.dossier.reference}
                  </Link>
                  <p className="text-xs text-slate-500">{formaterDate(bilan.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Recherches récentes">
          {recherches.length === 0 ? (
            <EtatVide titre="Aucune recherche enregistrée" />
          ) : (
            <ul className="space-y-2">
              {recherches.map((recherche, index) => (
                <li key={index} className="text-sm">
                  <Link
                    href={`/recherche?q=${encodeURIComponent(recherche.requete)}`}
                    className="text-etat-700 underline"
                  >
                    {recherche.requete}
                  </Link>
                  <span className="ml-2 text-xs text-slate-500">
                    {recherche.nbResultats} résultat{recherche.nbResultats > 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Ressources fréquemment utilisées">
          {documents.length === 0 ? (
            <EtatVide titre="Aucun document ingéré">
              <Link className="text-etat-700 underline" href="/base-documentaire">
                Déposer un document officiel
              </Link>
            </EtatVide>
          ) : (
            <ul className="space-y-2 text-sm">
              {documents.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  <p className="font-medium text-slate-800">{doc.titre}</p>
                  <p className="text-xs text-slate-500">
                    {doc.source}
                    {doc.datePublication && ` · ${doc.datePublication}`} · {doc.nbPassages} passages
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Rappel de cadre">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>L&apos;outil appuie le conseiller, il ne le remplace pas.</li>
            <li>Aucune réponse n&apos;est produite sans source documentaire identifiée.</li>
            <li>
              Les suggestions générées sont signalées comme telles et restent à valider par le
              conseiller.
            </li>
            <li>Seules les données nécessaires à l&apos;accompagnement sont enregistrées.</li>
          </ul>
        </Carte>
      </div>
    </>
  );
}

function Indicateur({
  libelle,
  valeur,
  href,
  complement,
}: {
  libelle: string;
  valeur: number;
  href: string;
  complement?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-etat-200"
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{libelle}</p>
      <p className="mt-1 text-2xl font-semibold text-etat-800">{valeur}</p>
      {complement && <p className="mt-1 text-xs text-slate-500">{complement}</p>}
    </Link>
  );
}
