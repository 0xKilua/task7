export function construireVocabulaire(textes: string[]): Map<string, number> {
  const vocabulaire = new Map<string, number>();
  for (const texte of textes) {
    for (const mot of texte.toLowerCase().match(/\p{L}+/gu) ?? []) {
      vocabulaire.set(mot, (vocabulaire.get(mot) ?? 0) + 1);
    }
  }
  return vocabulaire;
}

// Le crénage des PDF maquettés insère des espaces au milieu des mots (« p arfois »,
// « régio - nales ») : ces mots deviennent introuvables. Deux fragments ne sont recollés
// que si le mot obtenu existe intact ailleurs dans le même document et que l'un d'eux
// n'y apparaît pas seul — « par ce » ou « de puis » restent donc en l'état.
export function reparerMotsCoupes(texte: string, vocabulaire: Map<string, number>): string {
  const frequence = (mot: string) => vocabulaire.get(mot.toLowerCase()) ?? 0;
  let courant = texte;
  // Plusieurs passes pour les mots coupés en trois (« moda lit és »).
  for (let passe = 0; passe < 3; passe++) {
    const suivant = courant.replace(
      /(\p{L}+)([ \t]+-[ \t]+|[ \t])(?=(\p{Ll}+))/gu,
      (tout, a: string, _separateur: string, b: string) => {
        const joint = a + b;
        const recollable =
          joint.length >= 5 && frequence(joint) >= 1 && (frequence(a) <= 1 || frequence(b) <= 1);
        return recollable ? a : tout;
      },
    );
    if (suivant === courant) break;
    courant = suivant;
  }
  return courant;
}
