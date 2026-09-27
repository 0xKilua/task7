import { exigerSession } from '@/lib/auth';
import { exporterDossier } from '@/lib/dossiers';

export const dynamic = 'force-dynamic';

export function GET(_requete: Request, { params }: { params: { id: string } }) {
  const utilisateur = exigerSession();
  const donnees = exporterDossier(params.id, utilisateur.id);
  if (!donnees) return new Response('Accompagnement introuvable.', { status: 404 });

  const nomFichier = `donnees-${donnees.accompagnement.reference.replace(/[^A-Za-z0-9_-]+/g, '_')}.json`;
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
      'Cache-Control': 'no-store',
    },
  });
}
