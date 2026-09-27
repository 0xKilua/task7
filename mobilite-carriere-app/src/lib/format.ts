// Les rendez-vous (AAAA-MM-JJTHH:MM) et les dates d'échange (AAAA-MM-JJ) sont en heure
// locale sans fuseau : new Date() les lit bien en heure locale, contrairement à une date
// seule (AAAA-MM-JJ), que JavaScript interprète en UTC.

export function formaterRdv(rdv: string): string {
  const date = new Date(rdv);
  const jour = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const heure = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${jour} à ${heure}`;
}

export function formaterJour(jour: string): string {
  const [annee, mois, j] = jour.split('-').map(Number);
  return new Date(annee, mois - 1, j).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formaterHorodatage(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Une date seule appelle une formule (« publié en 2026 ») ; une mention rédigée
// (« Version en vigueur au 1er septembre 2026 ») se suffit à elle-même.
export function mentionDate(date: string, formule: string): string {
  return /^\d/.test(date.trim()) ? `${formule} ${date}` : date;
}
