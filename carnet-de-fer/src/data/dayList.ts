// Libellés des jours, isolés du contenu du programme : la navigation est un
// composant client, et importer DAYS depuis program.ts embarquerait tout le
// texte des exercices dans le bundle de chaque page.
export const DAY_TABS = [
  { id: "lundi", label: "Lundi" },
  { id: "mardi", label: "Mardi" },
  { id: "mercredi", label: "Mercredi" },
  { id: "jeudi", label: "Jeudi" },
  { id: "vendredi", label: "Vendredi" },
  { id: "samedi", label: "Samedi" },
  { id: "dimanche", label: "Dimanche" },
] as const;

// Contraint les identifiants de program.ts à rester alignés avec la navigation.
export type DayId = (typeof DAY_TABS)[number]["id"];
