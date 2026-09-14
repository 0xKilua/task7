import type { DayId } from "./dayList";

export type Video = { id: string; title: string; channel: string | null };

export type Exercise = {
  name: string;
  sets: string;
  weight: string;
  muscle: string;
  steps: string[];
  tip?: string;
  mistake?: string;
  video?: Video;
};

export type MuscuDay = {
  id: DayId;
  label: string;
  type: "muscu";
  title: string;
  exercises: Exercise[];
  finisher?: Exercise;
};

export type CardioDay = {
  id: DayId;
  label: string;
  type: "cardio";
  title: string;
  spec: string;
  description: string;
  why: string;
};

export type RestDay = {
  id: DayId;
  label: string;
  type: "repos";
  title: string;
  description: string;
  why: string;
};

export type Day = MuscuDay | CardioDay | RestDay;

export const DAYS: Day[] = [
  {
    id: "lundi",
    label: "Lundi",
    type: "muscu",
    title: "Pectoraux / Épaules / Triceps",
    exercises: [
      {
        name: "Développé couché au sol avec haltères",
        sets: "4 × 8–12",
        weight: "haltères adaptées",
        muscle: "Pectoraux (triceps, épaules)",
        steps: [
          "Allonge-toi au sol, genoux pliés, pieds à plat.",
          "Un haltère dans chaque main, monte-les au niveau de la poitrine, coudes pliés.",
          "Pousse les deux haltères vers le plafond jusqu'à avoir les bras presque tendus (pas bloqués).",
          "Redescends lentement jusqu'à ce que tes coudes touchent le sol — c'est le sol qui t'arrête.",
          "Répète pour le nombre de répétitions demandé.",
        ],
        tip: "Souffle en poussant, inspire en descendant. Serre légèrement les omoplates contre le sol.",
        mistake: "Erreur fréquente : aller trop vite. Fais des mouvements lents et contrôlés, surtout en descente.",
        video: { id: "uUGDRwge4F8", title: "How To: Dumbbell Floor Press", channel: "ScottHermanFitness" },
      },
      {
        name: "Écartés au sol avec haltères",
        sets: "3 × 12–15",
        weight: "haltères plus légères",
        muscle: "Pectoraux (isolation)",
        steps: [
          "Même position allongée que l'exercice précédent.",
          "Garde les bras légèrement pliés (angle fixe au coude) pendant tout le mouvement.",
          "Ouvre les bras sur les côtés en arc de cercle jusqu'à ce que les coudes touchent le sol.",
          "Ramène les haltères au-dessus de la poitrine en \"refermant\" les bras.",
        ],
        tip: "L'angle du coude ne bouge presque pas — seule l'épaule travaille.",
        mistake: "Ne prends pas trop lourd : c'est un mouvement d'isolation, la technique prime.",
        video: { id: "LPxiXYW7kmo", title: "How To: Dumbbell Fly On Floor", channel: "ScottHermanFitness" },
      },
      {
        name: "Développé militaire haltères",
        sets: "4 × 8–12",
        weight: "haltères modérées",
        muscle: "Épaules, triceps",
        steps: [
          "Debout ou assis, un haltère dans chaque main au niveau des épaules, paumes vers l'avant.",
          "Pousse les deux haltères au-dessus de la tête jusqu'à bras tendus.",
          "Redescends contrôlé jusqu'à la position de départ.",
        ],
        tip: "Contracte les abdos pour éviter de trop cambrer le bas du dos.",
        mistake: "Ne cambre pas exagérément pour \"aider\" à pousser plus lourd.",
        video: { id: "qEwKCR5JCog", title: "How To: Dumbbell Shoulder Press", channel: "ScottHermanFitness" },
      },
      {
        name: "Élévations latérales",
        sets: "4 × 12–15",
        weight: "haltères légères",
        muscle: "Épaules (largeur)",
        steps: [
          "Debout, un haltère dans chaque main, bras le long du corps, coudes légèrement pliés.",
          "Lève les deux bras sur les côtés jusqu'à hauteur des épaules.",
          "Redescends lentement, sans lâcher le contrôle.",
        ],
        tip: "Ne monte jamais plus haut que les épaules. La descente lente fait le travail.",
        mistake: "Erreur très fréquente : balancer le buste. Si tu dois te balancer, prends plus léger.",
        video: { id: "3VcKaXpzqRo", title: "How To: Dumbbell Side Lateral Raise", channel: "ScottHermanFitness" },
      },
      {
        name: "Barre EZ front (extension triceps)",
        sets: "3 × 10–12",
        weight: "barre EZ, 20 kg",
        muscle: "Triceps",
        steps: [
          "Allongé ou debout, tiens la barre EZ à bout de bras au-dessus de la tête (ou de la poitrine si allongé).",
          "Garde les coudes fixes, pointés vers le plafond, sans bouger.",
          "Plie uniquement les coudes pour descendre la barre derrière la tête.",
          "Remonte en tendant les bras jusqu'à la position de départ.",
        ],
        tip: "Seuls les avant-bras bougent. Coudes \"collés\" en l'air, immobiles.",
        mistake: "Si les coudes partent vers l'extérieur ou descendent, la charge est trop lourde.",
        video: { id: "el4bWdCJ-QA", title: "EZ Bar Skull Crushers (Lying Triceps Extension)", channel: null },
      },
    ],
    finisher: {
      name: "Gainage (planche)",
      sets: "3 × 1 min",
      weight: "poids du corps",
      muscle: "Sangle abdominale, tronc",
      steps: [
        "Appui sur les avant-bras et les pointes de pieds, corps aligné tête-bassin-talons.",
        "Serre les abdos et les fessiers pour ne pas laisser le bassin tomber ni monter.",
        "Regarde le sol pour garder la nuque neutre.",
        "Tiens la position, en progressant petit à petit.",
      ],
      tip: "Si 1 minute est trop dur, fais 3 × 20-30 s et augmente chaque semaine.",
      video: { id: "pSHjTRCQxIw", title: "How To: Plank", channel: "ScottHermanFitness" },
    },
  },
  {
    id: "mardi",
    label: "Mardi",
    type: "cardio",
    title: "Running tranquille",
    spec: "30 à 40 minutes",
    description: "Cours à une allure où tu pourrais tenir une conversation sans être essoufflé. Si tu n'y arrives pas, ralentis.",
    why: "Ce jour développe ton endurance de base et aide ton corps à récupérer de la séance de musculation du lundi.",
  },
  {
    id: "mercredi",
    label: "Mercredi",
    type: "muscu",
    title: "Dos / Biceps",
    exercises: [
      {
        name: "Rowing haltère un bras",
        sets: "4 × 10–12 / bras",
        weight: "haltère modérée à lourde",
        muscle: "Grand dorsal",
        steps: [
          "Un genou et une main en appui sur un banc, dos plat et parallèle au sol.",
          "Haltère dans l'autre main, bras tendu vers le sol.",
          "Tire l'haltère vers ta hanche en amenant le coude vers l'arrière.",
          "Redescends lentement jusqu'à bras tendu, puis recommence.",
        ],
        tip: "Le mouvement part du dos, pas du bras.",
        mistake: "Ne tourne pas le buste pour tirer plus lourd — épaules parallèles au sol.",
        video: { id: "pYcpY20QaE8", title: "How To: Dumbbell Bent-Over Row (Single-Arm)", channel: "ScottHermanFitness" },
      },
      {
        name: "Rowing barre EZ",
        sets: "4 × 10",
        weight: "barre EZ, 20 kg",
        muscle: "Ensemble du dos",
        steps: [
          "Buste penché à 45°, dos droit, genoux légèrement pliés.",
          "Barre EZ à deux mains, bras tendus vers le sol.",
          "Tire la barre vers le bas du ventre en serrant les omoplates.",
          "Redescends contrôlé jusqu'à bras tendus.",
        ],
        tip: "Garde le dos gainé pour protéger le bas du dos.",
        mistake: "Ne redresse pas le buste à chaque répétition — il reste fixe.",
        video: { id: "rQdudkp4ek4", title: "EZ-Bar Bent Over Barbell Row", channel: null },
      },
      {
        name: "Oiseau haltères",
        sets: "3 × 15",
        weight: "haltères très légères",
        muscle: "Arrière d'épaule, haut du dos",
        steps: [
          "Buste penché en avant, bras tendus vers le sol, légère flexion des coudes.",
          "Lève les deux bras sur les côtés jusqu'à hauteur du dos, en serrant les omoplates.",
          "Redescends lentement.",
        ],
        tip: "Mouvement lent, poids léger — la qualité d'exécution compte plus que la charge.",
        mistake: "Ne prends pas lourd : ça devient vite un mauvais mouvement de dos.",
        video: { id: "zqWVolge-Tk", title: "How To Rear Delt Fly / Reverse DB Fly", channel: "HASfit" },
      },
      {
        name: "🔸 Échauffement biceps (haltères 5 kg)",
        sets: "2 × 15–20",
        weight: "haltères 5 kg",
        muscle: "Biceps (échauffement)",
        steps: [
          "Debout, un haltère de 5 kg dans chaque main, paumes vers le haut.",
          "Plie les coudes pour monter les haltères vers les épaules, lentement (2 s montée, 2 s descente).",
          "2 séries légères, sans te fatiguer — le but est de faire circuler le sang et roder le mouvement.",
        ],
        tip: "Tu dois finir en te disant \"j'aurais pu en faire beaucoup plus\" — c'est normal.",
        mistake: "Ne saute pas cet échauffement : il protège tes articulations avant les séries lourdes.",
        video: { id: "d_TfENBv38s", title: "How To: Standing Dumbbell Bicep Curl", channel: "ScottHermanFitness" },
      },
      {
        name: "Curl barre EZ",
        sets: "4 × 10–12",
        weight: "barre EZ, 20 kg",
        muscle: "Biceps",
        steps: [
          "Debout, barre EZ en prise supination sur la partie coudée (plus confortable pour les poignets).",
          "Plie les coudes pour monter la barre vers les épaules, sans bouger le buste.",
          "Redescends lentement jusqu'à bras tendus.",
        ],
        tip: "Coudes fixes, collés le long du corps, du début à la fin.",
        mistake: "Si tu dois te balancer ou pousser avec les jambes, réduis les répétitions plutôt que tricher.",
        video: { id: "aEscWJ3dS3w", title: "How To: Outside-Grip EZ-Bar Curl", channel: "ScottHermanFitness" },
      },
      {
        name: "Curl marteau",
        sets: "3 × 12",
        weight: "haltères 10 kg",
        muscle: "Biceps, brachial",
        steps: [
          "Debout, un haltère de 10 kg dans chaque main, paumes face à face (\"prise marteau\").",
          "Plie les coudes pour monter les haltères vers les épaules en gardant cette prise.",
          "Redescends lentement jusqu'à bras tendus.",
        ],
        tip: "Si 10 kg est trop lourd pour 12 reps propres, fais 8-10 reps bien exécutées.",
        mistake: "Ne tourne pas le poignet — la prise neutre reste fixe du début à la fin.",
        video: { id: "zC3nLlEvin4", title: "How To: Dumbbell Hammer Curl", channel: "ScottHermanFitness" },
      },
    ],
    finisher: {
      name: "Relevés de jambes",
      sets: "3 × 15",
      weight: "poids du corps",
      muscle: "Abdominaux (bas du ventre)",
      steps: [
        "Allongé au sol, jambes tendues, mains sous les fessiers ou le long du corps.",
        "Lève les jambes tendues (ou légèrement pliées) jusqu'à la verticale.",
        "Redescends sans toucher le sol, puis remonte.",
      ],
      tip: "Garde le bas du dos plaqué au sol — s'il se cambre, vas moins bas ou moins vite.",
      video: { id: "0tzBVqiDwSs", title: "Lying Leg Raises — Correct Form & Tutorial", channel: "Fit Father Project" },
    },
  },
  {
    id: "jeudi",
    label: "Jeudi",
    type: "cardio",
    title: "Running fractionné",
    spec: "10' échauffement + 8×(1' rapide / 1' lent) + 10' retour au calme",
    description: "10 minutes de trot léger, puis 8 fois (1 minute rapide + 1 minute lente), puis 10 minutes de retour au calme en jogging très léger puis marche.",
    why: "Améliore ta capacité cardio plus efficacement qu'une course tranquille : les phases rapides te sortent de ta zone de confort, les phases lentes te font récupérer.",
  },
  {
    id: "vendredi",
    label: "Vendredi",
    type: "muscu",
    title: "Jambes / Abdos",
    exercises: [
      {
        name: "Squat gobelet avec haltère",
        sets: "4 × 12",
        weight: "un haltère à deux mains",
        muscle: "Quadriceps, fessiers",
        steps: [
          "Debout, un haltère tenu à deux mains contre la poitrine, comme une coupe.",
          "Descends en pliant genoux et hanches, dos droit, genoux dans l'axe des pieds.",
          "Descends jusqu'à cuisses parallèles au sol (ou moins bas selon ta souplesse).",
          "Repousse le sol avec tes talons pour remonter.",
        ],
        tip: "Talons au sol pendant toute la descente/remontée, regard devant toi.",
        mistake: "Erreur classique : les genoux qui rentrent vers l'intérieur en remontant.",
        video: { id: "MeIiIdhvXT4", title: "How To: Goblet Squat", channel: "ScottHermanFitness" },
      },
      {
        name: "Squat avec barre EZ",
        sets: "4 × 10",
        weight: "barre EZ, 20 kg",
        muscle: "Quadriceps, fessiers, gainage",
        steps: [
          "Barre EZ sur le haut du dos (trapèzes), mains en prise large pour stabiliser.",
          "Même mouvement que le squat gobelet : dos droit, genoux dans l'axe des pieds.",
          "Remonte en poussant sur les talons.",
        ],
        tip: "Contracte les abdos avant de descendre, comme un ceinturon naturel.",
        mistake: "À 20 kg le mouvement reste léger : priorise la technique (descente lente sur 3 s).",
        video: { id: "1oed-UmAxFs", title: "How To: Barbell Squat — 3 Golden Rules", channel: "ScottHermanFitness" },
      },
      {
        name: "Fentes marchées",
        sets: "3 × 12 / jambe",
        weight: "poids du corps ou haltères légères",
        muscle: "Quadriceps, fessiers, équilibre",
        steps: [
          "Debout, fais un grand pas en avant.",
          "Descends jusqu'à ce que le genou arrière frôle le sol, sans cogner.",
          "Repousse avec la jambe avant pour avancer et enchaîner avec l'autre jambe.",
        ],
        tip: "Buste bien droit tout du long, pas besoin de te pencher en avant.",
        mistake: "Le genou avant ne doit jamais dépasser la pointe du pied.",
        video: { id: "D7KaRcUTQeE", title: "How To: Dumbbell Stepping Lunge", channel: "ScottHermanFitness" },
      },
      {
        name: "Soulevé de terre roumain",
        sets: "4 × 10",
        weight: "haltères modérées",
        muscle: "Ischio-jambiers, fessiers",
        steps: [
          "Debout, un haltère dans chaque main devant les cuisses, dos droit.",
          "Pousse les hanches vers l'arrière en laissant les haltères descendre le long des jambes, genoux fixes et légèrement fléchis.",
          "Descends jusqu'à sentir l'étirement à l'arrière des cuisses, puis remonte en poussant les hanches vers l'avant.",
        ],
        tip: "Garde les haltères proches des jambes tout du long.",
        mistake: "Ne rondis jamais le dos pour descendre plus bas — arrête-toi où le dos reste droit.",
        video: { id: "FQKfr1YDhEk", title: "How To: Dumbbell Romanian Deadlift", channel: "ScottHermanFitness" },
      },
      {
        name: "Mollets debout",
        sets: "4 × 20",
        weight: "haltères en main",
        muscle: "Mollets",
        steps: [
          "Debout, un haltère dans chaque main, monte sur la pointe des pieds en contractant les mollets.",
          "Marque une pause d'une seconde en haut.",
          "Redescends lentement, un peu plus bas que la position de départ si possible.",
        ],
        tip: "La pause en haut est ce qui rend l'exercice efficace — ne la saute pas.",
        video: { id: "wxwY7GXxL4k", title: "Standing Dumbbell Calf Raises", channel: "Bodybuilding.com" },
      },
    ],
    finisher: {
      name: "Crunch + Gainage",
      sets: "Crunch 4×20 + Gainage 3×1 min",
      weight: "poids du corps",
      muscle: "Abdominaux",
      steps: [
        "Crunch : allongé, genoux pliés, mains derrière la tête ou croisées sur la poitrine.",
        "Enroule le buste vers les genoux en contractant les abdos, sans tirer sur la nuque.",
        "Mouvement court — pas besoin de te relever complètement.",
        "Termine par le gainage (planche), comme le lundi.",
      ],
      tip: "Les mains soutiennent juste légèrement la tête, elles ne tirent pas dessus.",
      video: { id: "mQXtBG4RfJk", title: "How To Crunch Properly", channel: "HASfit" },
    },
  },
  {
    id: "samedi",
    label: "Samedi",
    type: "cardio",
    title: "Running tranquille",
    spec: "45 minutes",
    description: "Même principe que le mardi : allure facile, où tu peux discuter, mais un peu plus longtemps.",
    why: "Développe ton endurance de fond et ta capacité de récupération générale, en complément du travail plus intense du jeudi.",
  },
  {
    id: "dimanche",
    label: "Dimanche",
    type: "repos",
    title: "Repos",
    description: "Repos complet, ou une activité très légère comme la marche ou des étirements doux.",
    why: "C'est pendant le repos que tes muscles se réparent et deviennent plus forts.",
  },
];

export const GLOSSARY_TERMS: [string, string][] = [
  ["Série", "Un bloc de répétitions fait sans s'arrêter. \"4 séries de 10\" = tu fais le mouvement 10 fois, tu te reposes, tu recommences, 4 fois au total."],
  ["Répétition (rep)", "Un aller-retour complet du mouvement."],
  ["Charge", "Le poids utilisé pour un exercice (haltère, barre...)."],
  ["RIR (Répétitions En Réserve)", "\"RIR 2\" veut dire que tu arrêtes la série alors que tu aurais pu faire 2 répétitions de plus."],
  ["Tempo", "La vitesse d'exécution. Ralentir la descente (3-4 s) rend l'exercice plus dur sans changer le poids."],
  ["Échauffement", "Mouvements légers avant l'effort principal, pour préparer muscles et articulations."],
  ["Isolation", "Exercice qui ne fait travailler qu'un seul muscle/une seule articulation (ex : élévations latérales)."],
  ["Polyarticulaire", "Exercice qui fait travailler plusieurs muscles/articulations (ex : squat). Généralement les plus efficaces."],
  ["Gainage", "Contracter abdos et tronc pour stabiliser la colonne pendant un effort."],
  ["Courbatures (DOMS)", "Douleurs musculaires 1-2 jours après une séance inhabituelle. Normal, ça passe en quelques jours."],
  ["Prise supination", "Tenir une barre/un haltère paumes vers le haut."],
  ["Prise neutre", "Tenir un haltère paumes qui se font face (comme un marteau)."],
  ["Fourchette de répétitions", "L'intervalle donné (ex : \"8-12\") ; tu restes dans cette zone à chaque série."],
];

export type ExerciseMeta = { name: string; kind: "muscu" | "cardio"; dayLabel: string };

export const EXERCISE_INDEX: Record<string, Record<string, ExerciseMeta>> = (() => {
  const index: Record<string, Record<string, ExerciseMeta>> = {};
  DAYS.forEach((day) => {
    if (day.type === "muscu") {
      index[day.id] = {};
      const all = day.finisher ? [...day.exercises, day.finisher] : day.exercises;
      all.forEach((ex) => {
        index[day.id][ex.name] = { name: ex.name, kind: "muscu", dayLabel: day.label };
      });
    } else if (day.type === "cardio") {
      index[day.id] = { session: { name: day.title, kind: "cardio", dayLabel: day.label } };
    }
  });
  return index;
})();

export function progressionOptions() {
  const options: { dayId: string; itemId: string; label: string }[] = [];
  DAYS.forEach((day) => {
    if (day.type === "muscu") {
      const all = day.finisher ? [...day.exercises, day.finisher] : day.exercises;
      all.forEach((ex) => options.push({ dayId: day.id, itemId: ex.name, label: `${day.label} — ${ex.name}` }));
    } else if (day.type === "cardio") {
      options.push({ dayId: day.id, itemId: "session", label: `${day.label} — ${day.title}` });
    }
  });
  return options;
}
