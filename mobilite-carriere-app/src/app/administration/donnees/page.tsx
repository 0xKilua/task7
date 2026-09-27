import { appliquerPurgeAction, enregistrerPolitiqueAction } from '@/app/administration/actions';
import { OngletsAdministration } from '@/app/administration/Onglets';
import { Bouton, Carte, TitrePage } from '@/components/ui';
import { exigerAdministrateur } from '@/lib/auth';
import { MOIS_MAX, apercuPurge, dernierePurge, lirePolitique } from '@/lib/conservation';
import { formaterHorodatage } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function PageDonnees({ searchParams }: { searchParams: { erreur?: string; succes?: string } }) {
  exigerAdministrateur();
  const politique = lirePolitique();
  const apercu = apercuPurge(politique);
  const purge = dernierePurge();
  const aucunePolitique = politique.moisDossiersClos === null && politique.moisJournal === null;

  return (
    <>
      <TitrePage
        titre="Données et conservation"
        chapo="Durées de conservation des données et suppression des données échues. Aucune donnée n'est supprimée tant qu'une durée n'est pas fixée."
      />
      <OngletsAdministration actif="/administration/donnees" />

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
        <Carte titre="Politique de conservation">
          <p className="mb-4 rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Ces durées relèvent de votre administration : fixez-les avec votre délégué à la protection
            des données (DPO), conformément au registre des traitements. L&apos;application n&apos;en
            propose aucune par défaut.
          </p>
          <form action={enregistrerPolitiqueAction} className="space-y-4">
            <div>
              <label htmlFor="moisDossiersClos" className="block text-xs font-medium text-slate-600">
                Conservation des accompagnements clos (en mois, à compter de la clôture)
              </label>
              <input
                id="moisDossiersClos"
                name="moisDossiersClos"
                type="number"
                min={1}
                max={MOIS_MAX}
                defaultValue={politique.moisDossiersClos ?? ''}
                placeholder="Non fixée"
                className="mt-1 w-40 rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="moisJournal" className="block text-xs font-medium text-slate-600">
                Conservation du journal des actions (en mois)
              </label>
              <input
                id="moisJournal"
                name="moisJournal"
                type="number"
                min={1}
                max={MOIS_MAX}
                defaultValue={politique.moisJournal ?? ''}
                placeholder="Non fixée"
                className="mt-1 w-40 rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <Bouton>Enregistrer la politique</Bouton>
          </form>
        </Carte>

        <Carte titre="Appliquer la politique">
          {aucunePolitique ? (
            <p className="text-sm text-slate-600">Aucune durée n&apos;est fixée : rien ne sera supprimé.</p>
          ) : (
            <p className="text-sm text-slate-700">
              Seraient supprimés définitivement : <strong>{apercu.dossiers}</strong> accompagnement(s)
              clos depuis plus de {politique.moisDossiersClos ?? '—'} mois (avec leurs fiches, bilans,
              plan, notes et trames) et <strong>{apercu.journal}</strong> entrée(s) de journal de plus de{' '}
              {politique.moisJournal ?? '—'} mois.
            </p>
          )}
          <form action={appliquerPurgeAction} className="mt-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" name="confirmation" value="oui" className="mt-1" />
              Je confirme la suppression définitive des données échues.
            </label>
            <Bouton variante="secondaire">Appliquer maintenant</Bouton>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            {purge
              ? `Dernière application : ${formaterHorodatage(purge.ts)} — ${purge.details ?? ''}`
              : 'La politique n’a encore jamais été appliquée.'}{' '}
            Les sessions expirées et les tentatives de connexion de plus de 24 heures sont effacées à
            chaque application.
          </p>
        </Carte>
      </div>
    </>
  );
}
