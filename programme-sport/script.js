// ---------- Données du programme ----------

const INTRO = {
  id: "intro",
  label: "Avant de commencer",
  type: "intro",
};

const JOURNAL = {
  id: "journal",
  label: "Journal",
  type: "journal",
};

const PROGRESSION = {
  id: "progression",
  label: "Progression",
  type: "progression",
};

const GLOSSAIRE = {
  id: "lexique",
  label: "Lexique",
  type: "glossaire",
};

const DAYS = [
  INTRO,
  JOURNAL,
  {
    id: "lundi",
    label: "Lundi",
    type: "muscu",
    title: "Pectoraux / Épaules / Triceps",
    color: "blue",
    exercises: [
      {
        name: "Développé couché au sol avec haltères",
        sets: "4 séries × 8 à 12 répétitions",
        weight: "Haltères adaptées (garde 1-2 reps en réserve à la fin de chaque série)",
        muscle: "Pectoraux (triceps et épaules en soutien)",
        steps: [
          "Allonge-toi au sol, genoux pliés, pieds à plat.",
          "Prends un haltère dans chaque main, monte-les au niveau de la poitrine, coudes pliés.",
          "Pousse les deux haltères vers le plafond jusqu'à avoir les bras presque tendus (pas bloqués).",
          "Redescends lentement jusqu'à ce que tes coudes touchent le sol — c'est le sol qui t'arrête, tu n'as pas besoin d'aller plus bas.",
          "Répète pour le nombre de répétitions demandé."
        ],
        tip: "Souffle en poussant les haltères vers le haut, inspire en descendant. Serre légèrement les omoplates contre le sol pour stabiliser les épaules.",
        mistake: "Erreur fréquente de débutant : vouloir aller trop vite. Fais des mouvements lents et contrôlés, surtout en descente — c'est là que tu progresses le plus."
      },
      {
        name: "Écartés au sol avec haltères",
        sets: "3 séries × 12 à 15 répétitions",
        weight: "Haltères plus légères que pour le développé couché",
        muscle: "Pectoraux (isolation)",
        steps: [
          "Même position allongée que l'exercice précédent.",
          "Garde les bras légèrement pliés (angle fixe au coude) pendant tout le mouvement.",
          "Ouvre les bras sur les côtés, comme si tu voulais dessiner un grand cercle, jusqu'à ce que les coudes touchent le sol.",
          "Ramène les haltères au-dessus de la poitrine en \"refermant\" les bras, comme si tu enlaçais un gros ballon."
        ],
        tip: "L'angle du coude ne doit presque pas bouger du début à la fin — seule l'épaule travaille. Si tu sens que ça tire sur les triceps, c'est que tu plies trop les coudes.",
        mistake: "Ne prends pas trop lourd sur cet exercice : c'est un mouvement d'isolation, la technique compte plus que le poids."
      },
      {
        name: "Développé militaire haltères",
        sets: "4 séries × 8 à 12 répétitions",
        weight: "Haltères modérées",
        muscle: "Épaules (avant et côté), triceps en soutien",
        steps: [
          "Debout ou assis, tiens un haltère dans chaque main au niveau des épaules, paumes tournées vers l'avant.",
          "Pousse les deux haltères au-dessus de la tête jusqu'à avoir les bras tendus.",
          "Redescends contrôlé jusqu'à revenir à la position de départ."
        ],
        tip: "Contracte les abdos (comme si on allait te donner un petit coup dans le ventre) pour éviter de trop cambrer le bas du dos.",
        mistake: "Ne cambre pas exagérément pour \"aider\" à pousser plus lourd — c'est mauvais pour le dos. Si tu dois beaucoup cambrer, prends plus léger."
      },
      {
        name: "Élévations latérales",
        sets: "4 séries × 12 à 15 répétitions",
        weight: "Haltères légères — cet exercice se fait toujours léger",
        muscle: "Épaules (côté, donne la largeur)",
        steps: [
          "Debout, un haltère dans chaque main, bras le long du corps, coudes légèrement pliés.",
          "Lève les deux bras sur les côtés jusqu'à ce qu'ils soient à hauteur des épaules (comme un T).",
          "Redescends lentement, sans lâcher le contrôle du mouvement."
        ],
        tip: "Ne monte jamais plus haut que les épaules. La descente lente est ce qui fait travailler le muscle le plus efficacement.",
        mistake: "Erreur très fréquente : balancer le buste ou utiliser l'élan pour monter les bras. Si tu dois te balancer, c'est trop lourd — prends plus léger."
      },
      {
        name: "Barre EZ front (extension triceps)",
        sets: "3 séries × 10 à 12 répétitions",
        weight: "Barre EZ chargée à 20 kg (retire un disque si tu ne tiens pas 10 reps propres)",
        muscle: "Triceps (arrière du bras)",
        steps: [
          "Allongé ou debout, tiens la barre EZ à bout de bras au-dessus de la tête (ou au-dessus de la poitrine si allongé).",
          "Garde les coudes fixes, pointés vers le plafond, sans bouger pendant tout l'exercice.",
          "Plie uniquement les coudes pour descendre la barre derrière la tête.",
          "Remonte en tendant les bras jusqu'à la position de départ."
        ],
        tip: "Seuls les avant-bras bougent. Imagine que tes coudes sont \"collés\" en l'air et ne doivent jamais s'écarter ni descendre.",
        mistake: "Si tes coudes partent vers l'extérieur ou descendent pendant le mouvement, c'est que la charge est trop lourde pour l'instant."
      }
    ],
    finisher: {
      name: "Gainage (planche)",
      sets: "3 séries × 1 minute",
      muscle: "Sangle abdominale profonde, stabilité du tronc",
      steps: [
        "Mets-toi en appui sur les avant-bras et les pointes de pieds, corps bien aligné de la tête aux talons.",
        "Serre les abdos et les fessiers pour ne pas laisser le bassin tomber ni monter.",
        "Regarde le sol pour garder la nuque dans le prolongement du dos.",
        "Tiens la position 1 minute (ou le temps que tu peux, en progressant petit à petit)."
      ],
      tip: "Si 1 minute est trop dur au début, fais 3 séries de 20-30 secondes et augmente petit à petit chaque semaine."
    }
  },
  {
    id: "mardi",
    label: "Mardi",
    type: "cardio",
    title: "Running tranquille (30 à 40 minutes)",
    description: "Cours à une allure où tu pourrais tenir une conversation sans être essoufflé. Si tu n'arrives pas à parler en courant, ralentis — ce n'est pas un jour pour repousser tes limites.",
    why: "Ce jour sert à développer ton endurance de base et à aider ton corps à récupérer de la séance de musculation du lundi. Courir doucement le lendemain d'une séance de muscu améliore la récupération plutôt que de la freiner."
  },
  {
    id: "mercredi",
    label: "Mercredi",
    type: "muscu",
    title: "Dos / Biceps",
    color: "blue",
    exercises: [
      {
        name: "Rowing haltère un bras",
        sets: "4 séries × 10 à 12 répétitions (par bras)",
        weight: "Haltère modérée à lourde",
        muscle: "Grand dorsal (le muscle en V du dos)",
        steps: [
          "Pose un genou et une main sur un banc (ou une chaise stable), dos bien plat et parallèle au sol.",
          "Tiens un haltère dans l'autre main, bras tendu vers le sol.",
          "Tire l'haltère vers ta hanche en amenant le coude vers l'arrière, comme pour \"démarrer une tondeuse\".",
          "Redescends lentement jusqu'à bras tendu, puis recommence."
        ],
        tip: "Le mouvement part du dos, pas du bras. Imagine que tu essaies de rapprocher ton omoplate de ta colonne vertébrale.",
        mistake: "Ne tourne pas le buste pour t'aider à tirer plus lourd — garde les épaules parallèles au sol tout du long."
      },
      {
        name: "Rowing barre EZ",
        sets: "4 séries × 10 répétitions",
        weight: "Barre EZ chargée à 20 kg",
        muscle: "Ensemble du dos (dorsaux, trapèzes, milieu du dos)",
        steps: [
          "Penche le buste en avant, environ à 45°, dos bien droit, genoux légèrement pliés.",
          "Tiens la barre EZ à deux mains, bras tendus vers le sol.",
          "Tire la barre vers le bas du ventre en serrant les omoplates l'une vers l'autre.",
          "Redescends contrôlé jusqu'à bras tendus."
        ],
        tip: "Garde le dos gainé (comme si tu allais encaisser un coup) pour protéger le bas du dos pendant tout le mouvement.",
        mistake: "Ne redresse pas le buste à chaque répétition pour \"aider\" — le buste reste fixe, seuls les bras et le dos bougent."
      },
      {
        name: "Oiseau haltères",
        sets: "3 séries × 15 répétitions",
        weight: "Haltères très légères — c'est un exercice de finition, pas de force",
        muscle: "Arrière de l'épaule et haut du dos",
        steps: [
          "Penche le buste en avant, bras tendus vers le sol avec une légère flexion des coudes.",
          "Lève les deux bras sur les côtés jusqu'à hauteur du dos, en serrant les omoplates.",
          "Redescends lentement."
        ],
        tip: "Mouvement lent et contrôlé, avec un poids léger — la qualité d'exécution compte bien plus que la charge ici.",
        mistake: "Ne prends pas lourd sur cet exercice, même si tu en as l'impression de capacité : ça devient vite un mauvais mouvement de dos si c'est trop lourd."
      },
      {
        name: "🔸 Échauffement biceps (haltères 5 kg)",
        sets: "2 séries × 15 à 20 répétitions",
        weight: "Haltères 5 kg",
        muscle: "Biceps (échauffement, pas travail au maximum)",
        steps: [
          "Debout, un haltère de 5 kg dans chaque main, paumes tournées vers le haut.",
          "Plie les coudes pour monter les haltères vers les épaules, lentement (2 secondes de montée, 2 secondes de descente).",
          "Fais 2 séries légères, sans te fatiguer — le but est de faire circuler le sang dans le muscle et de roder le mouvement avant les séries lourdes."
        ],
        tip: "Tu dois terminer ces 2 séries en te disant \"je pourrais en faire beaucoup plus\" — c'est normal, ce n'est pas un exercice pour se fatiguer.",
        mistake: "Ne saute pas cet échauffement : il prépare tes articulations (coudes, poignets) et réduit le risque de te blesser sur les séries lourdes qui suivent."
      },
      {
        name: "Curl barre EZ",
        sets: "4 séries × 10 à 12 répétitions",
        weight: "Barre EZ chargée à 20 kg",
        muscle: "Biceps",
        steps: [
          "Debout, tiens la barre EZ avec les paumes vers le haut, sur la partie coudée de la barre (plus confortable pour les poignets).",
          "Plie les coudes pour monter la barre vers les épaules, sans bouger le buste.",
          "Redescends lentement jusqu'à bras tendus."
        ],
        tip: "Garde les coudes fixes, collés le long du corps, du début à la fin du mouvement.",
        mistake: "Si tu dois te balancer avec le dos ou pousser avec les jambes pour faire monter la barre, c'est trop lourd pour l'instant : réduis les répétitions plutôt que de tricher avec le corps."
      },
      {
        name: "Curl marteau",
        sets: "3 séries × 12 répétitions",
        weight: "Haltères 10 kg",
        muscle: "Biceps et brachial (épaisseur du bras)",
        steps: [
          "Debout, un haltère de 10 kg dans chaque main, paumes face à face (comme si tu tenais deux marteaux).",
          "Plie les coudes pour monter les haltères vers les épaules en gardant cette prise \"paumes face à face\" tout du long.",
          "Redescends lentement jusqu'à bras tendus."
        ],
        tip: "Si 10 kg est trop lourd pour tenir 12 répétitions propres, fais 8-10 répétitions bien exécutées plutôt que de te déformer pour finir la série.",
        mistake: "Ne tourne pas le poignet en cours de mouvement — la prise \"paumes face à face\" reste fixe du début à la fin."
      }
    ],
    finisher: {
      name: "Relevés de jambes",
      sets: "3 séries × 15 répétitions",
      muscle: "Abdominaux du bas du ventre",
      steps: [
        "Allonge-toi au sol, jambes tendues, mains sous les fessiers ou le long du corps.",
        "Lève les jambes tendues (ou légèrement pliées si c'est trop dur) jusqu'à la verticale.",
        "Redescends sans laisser les pieds toucher le sol, puis remonte."
      ],
      tip: "Garde le bas du dos bien plaqué au sol pendant tout le mouvement — s'il se cambre, c'est que tu vas trop bas ou trop vite."
    }
  },
  {
    id: "jeudi",
    label: "Jeudi",
    type: "cardio",
    title: "Running fractionné",
    description: "10 minutes d'échauffement en trot léger, puis 8 fois (1 minute rapide + 1 minute lente), puis 10 minutes de retour au calme en jogging très léger puis marche.",
    why: "Ce type de séance améliore ta capacité cardio (le fameux \"souffle\") plus efficacement qu'une course tranquille. Les phases rapides te font sortir un peu de ta zone de confort, les phases lentes te permettent de récupérer avant de repartir."
  },
  {
    id: "vendredi",
    label: "Vendredi",
    type: "muscu",
    title: "Jambes / Abdos",
    color: "blue",
    exercises: [
      {
        name: "Squat gobelet avec haltère",
        sets: "4 séries × 12 répétitions",
        weight: "Un haltère tenu à deux mains",
        muscle: "Cuisses (quadriceps) et fessiers",
        steps: [
          "Debout, tiens un haltère à deux mains contre la poitrine, comme une coupe.",
          "Descends en pliant les genoux et les hanches, dos droit, genoux dans l'axe des pieds (ils ne partent pas vers l'intérieur).",
          "Descends jusqu'à ce que tes cuisses soient parallèles au sol (ou moins bas si ta souplesse ne le permet pas encore).",
          "Repousse le sol avec tes talons pour remonter."
        ],
        tip: "Garde tes talons bien au sol pendant toute la descente et la remontée, et regarde devant toi, pas vers le bas.",
        mistake: "Erreur classique : les genoux qui partent vers l'intérieur en remontant. Pense à \"pousser les genoux vers l'extérieur\" activement."
      },
      {
        name: "Squat avec barre EZ",
        sets: "4 séries × 10 répétitions",
        weight: "Barre EZ chargée à 20 kg",
        muscle: "Cuisses, fessiers, gainage global",
        steps: [
          "Place la barre EZ sur le haut du dos (sur les trapèzes, pas sur la nuque), mains en prise large pour la stabiliser.",
          "Fais le même mouvement que le squat gobelet : descends dos droit, genoux dans l'axe des pieds.",
          "Remonte en poussant sur les talons."
        ],
        tip: "Contracte les abdos avant de commencer à descendre, comme un ceinturon naturel qui protège ta colonne.",
        mistake: "À 20 kg le mouvement restera assez léger : concentre-toi sur la technique (descente lente sur 3 secondes) plutôt que de chercher à \"sentir\" une charge lourde."
      },
      {
        name: "Fentes marchées",
        sets: "3 séries × 12 répétitions par jambe",
        weight: "Poids du corps, ou haltères légères dans chaque main si tu veux plus de difficulté",
        muscle: "Cuisses, fessiers, équilibre",
        steps: [
          "Debout, fais un grand pas en avant.",
          "Descends jusqu'à ce que le genou arrière frôle le sol, sans le laisser cogner.",
          "Repousse avec la jambe avant pour avancer et enchaîner le pas suivant avec l'autre jambe."
        ],
        tip: "Garde le buste bien droit tout du long — pas besoin de te pencher en avant.",
        mistake: "Le genou avant ne doit jamais dépasser la pointe du pied : si c'est le cas, fais un pas plus grand."
      },
      {
        name: "Soulevé de terre roumain",
        sets: "4 séries × 10 répétitions",
        weight: "Haltères modérées",
        muscle: "Arrière des cuisses (ischio-jambiers) et fessiers",
        steps: [
          "Debout, un haltère dans chaque main devant les cuisses, dos droit.",
          "Pousse les hanches vers l'arrière (comme pour fermer une porte avec les fesses) en laissant les haltères descendre le long des jambes.",
          "Les genoux restent légèrement fléchis et fixes — ce n'est pas eux qui bougent.",
          "Descends jusqu'à sentir un étirement à l'arrière des cuisses, puis remonte en poussant les hanches vers l'avant."
        ],
        tip: "Garde les haltères proches des jambes pendant tout le mouvement, comme s'ils glissaient le long de tes cuisses.",
        mistake: "Ne rondis jamais le dos pour descendre plus bas : arrête-toi où ton dos peut rester droit, même si ça semble \"peu profond\" au début."
      },
      {
        name: "Mollets debout",
        sets: "4 séries × 20 répétitions",
        weight: "Haltères en main",
        muscle: "Mollets",
        steps: [
          "Debout, un haltère dans chaque main, monte sur la pointe des pieds en contractant les mollets.",
          "Marque une pause d'une seconde en haut.",
          "Redescends lentement, si possible un peu plus bas que ta position de départ pour bien étirer le mollet."
        ],
        tip: "La pause en haut du mouvement est ce qui rend cet exercice efficace — ne la saute pas."
      }
    ],
    finisher: {
      name: "Crunch + Gainage",
      sets: "Crunch : 4 × 20 — Gainage : 3 × 1 minute (identique au lundi)",
      muscle: "Abdominaux",
      steps: [
        "Crunch : allongé, genoux pliés, mains derrière la tête ou croisées sur la poitrine, enroule le buste vers les genoux en contractant les abdos, sans tirer sur la nuque.",
        "Le mouvement est court, pas besoin de se relever complètement — c'est la contraction qui compte.",
        "Termine par le gainage (planche), comme décrit le lundi."
      ],
      tip: "Si tu tires avec les mains sur ta tête, tu risques de te faire mal au cou — les mains soutiennent juste légèrement la tête, elles ne tirent pas."
    }
  },
  {
    id: "samedi",
    label: "Samedi",
    type: "cardio",
    title: "Running tranquille (45 minutes)",
    description: "Même principe que le mardi : allure facile, où tu peux discuter sans être essoufflé, mais un peu plus longtemps.",
    why: "Cette sortie plus longue développe ton endurance de fond et ta capacité de récupération générale, en complément du travail plus intense du jeudi."
  },
  {
    id: "dimanche",
    label: "Dimanche",
    type: "repos",
    title: "Repos",
    description: "Repos complet, ou une activité très légère comme la marche ou des étirements doux.",
    why: "C'est pendant le repos que tes muscles se réparent et deviennent plus forts — sauter cette journée régulièrement freine tes progrès autant qu'un entraînement raté."
  },
  PROGRESSION,
  GLOSSAIRE
];

// ---------- Index de tous les éléments loggables (exercices + séances cardio) ----------

const EXERCISE_INDEX = {};
DAYS.forEach(day => {
  if (day.type === "muscu") {
    EXERCISE_INDEX[day.id] = {};
    const all = day.finisher ? [...day.exercises, day.finisher] : day.exercises;
    all.forEach(ex => {
      EXERCISE_INDEX[day.id][ex.name] = { name: ex.name, kind: "muscu", dayLabel: day.label };
    });
  } else if (day.type === "cardio") {
    EXERCISE_INDEX[day.id] = {
      session: { name: day.title, kind: "cardio", dayLabel: day.label }
    };
  }
});

// ---------- Contenu de l'onglet "Avant de commencer" ----------

function renderIntro() {
  return `
    <div class="intro-block">
      <h2>👋 Bienvenue, débutant·e !</h2>
      <p>Ce programme est prévu pour te faire progresser en toute sécurité même si tu n'as jamais touché un haltère. Voici les quelques règles à connaître avant ta première séance.</p>
    </div>

    <div class="intro-block">
      <h3>📖 Comment lire une fiche d'exercice</h3>
      <p>Quand tu vois <strong>« 4 séries × 8 à 12 répétitions »</strong>, ça veut dire :</p>
      <ul>
        <li>Tu fais le mouvement <strong>8 à 12 fois de suite</strong> → c'est <strong>une série</strong>.</li>
        <li>Tu te reposes environ <strong>60 à 90 secondes</strong>.</li>
        <li>Tu recommences, jusqu'à avoir fait <strong>4 séries</strong> au total.</li>
      </ul>
      <p>Vise le haut de la fourchette (12 dans cet exemple) en gardant une bonne technique. Si tu n'arrives même pas à 8 répétitions propres, c'est que la charge est trop lourde.</p>
    </div>

    <div class="intro-block">
      <h3>⚖️ Comment choisir le bon poids</h3>
      <ul>
        <li>Tu dois pouvoir finir toutes tes répétitions avec une <strong>bonne technique</strong>, sans te tordre ou te balancer.</li>
        <li>Sur les 2 dernières répétitions de chaque série, ça doit être <strong>difficile mais faisable</strong> — pas impossible, pas trop facile.</li>
        <li>Si tu termines une série en te disant "j'aurais pu en faire 10 de plus", c'est trop léger. Si tu ne finis pas la série, c'est trop lourd.</li>
      </ul>
    </div>

    <div class="intro-block">
      <h3>🛡️ Les règles de sécurité pour débuter</h3>
      <ul>
        <li><strong>La technique avant le poids.</strong> Un mouvement bien fait avec 5 kg est plus utile qu'un mouvement bâclé avec 15 kg.</li>
        <li><strong>Respire</strong> : souffle pendant l'effort (quand tu pousses ou tires), inspire en revenant à la position de départ. Ne bloque jamais ta respiration.</li>
        <li><strong>Échauffe-toi</strong> avant les séries lourdes (articulations + un peu de cardio léger 5 minutes suffisent).</li>
        <li><strong>Repose-toi 60 à 90 secondes entre les séries</strong>, et au moins un jour complet avant de refaire travailler le même groupe musculaire.</li>
        <li>Une petite courbature 1-2 jours après une séance est normale (ça s'appelle des <em>DOMS</em>, voir le lexique). Une <strong>douleur vive dans une articulation</strong> n'est pas normale : arrête l'exercice et laisse reposer.</li>
      </ul>
    </div>

    <div class="intro-block">
      <h3>📈 Comment progresser sans te blesser</h3>
      <ul>
        <li>Quand tu atteins facilement le haut de la fourchette sur <strong>toutes tes séries</strong>, tu peux augmenter légèrement la charge la séance suivante.</li>
        <li>Pour le <strong>curl marteau (10 kg)</strong> et l'<strong>échauffement biceps (5 kg)</strong> : ce sont des haltères à poids fixe, tu ne peux pas ajouter de disques. Progresse en faisant plus de répétitions, en ralentissant la descente, ou en ajoutant une petite pause en haut du mouvement.</li>
        <li>Pour la <strong>barre EZ</strong> : tu peux ajouter un disque quand 20 kg devient facile sur toute la série.</li>
        <li>Vise 7 à 8 heures de sommeil par nuit — c'est pendant le sommeil que le muscle se répare et progresse.</li>
      </ul>
    </div>

    <div class="intro-block">
      <h3>🗓️ Ta progression sur 8 semaines</h3>
      <table class="week-table">
        <tr><th>Semaines</th><th>Objectif</th></tr>
        <tr><td>1-2</td><td>Apprendre les mouvements, charges légères à modérées</td></tr>
        <tr><td>3-4</td><td>Augmenter progressivement (+1-2 kg quand c'est possible, sinon plus de reps/tempo plus lent)</td></tr>
        <tr><td>5-6</td><td>Consolider, viser le haut de la fourchette sur la majorité des séries</td></tr>
        <tr><td>7-8</td><td>Pic de forme, avec éventuellement une semaine plus légère (semaine 8) si tu sens de la fatigue</td></tr>
      </table>
    </div>

    <div class="intro-block">
      <h3>🎒 Ton matériel</h3>
      <ul>
        <li><strong>2 haltères de 10 kg</strong> → travail principal des biceps (curl marteau)</li>
        <li><strong>2 haltères de 5 kg</strong> → échauffement des biceps avant les séries lourdes</li>
        <li><strong>Barre EZ chargée à 20 kg</strong> → curl, rowing, extension triceps, squat</li>
      </ul>
    </div>
  `;
}

// ---------- Contenu du glossaire ----------

const GLOSSARY_TERMS = [
  ["Série", "Un bloc de répétitions fait sans s'arrêter. Ex : \"4 séries de 10\" veut dire que tu fais le mouvement 10 fois, tu te reposes, puis tu recommences, 4 fois au total."],
  ["Répétition (rep)", "Un aller-retour complet du mouvement (par exemple monter puis redescendre l'haltère une fois)."],
  ["Charge", "Le poids que tu utilises pour un exercice (l'haltère, la barre...)."],
  ["RIR (Répétitions En Réserve)", "Une échelle pour savoir si tu es proche de l'échec. \"RIR 2\" veut dire que tu arrêtes la série alors que tu aurais encore pu faire 2 répétitions de plus."],
  ["Tempo", "La vitesse d'exécution du mouvement. Ralentir le tempo (par exemple une descente de 3-4 secondes) rend l'exercice plus difficile sans changer le poids."],
  ["Échauffement", "Des mouvements légers avant l'effort principal, pour préparer les muscles et articulations et réduire le risque de blessure."],
  ["Isolation", "Un exercice qui ne fait travailler qu'un seul muscle ou une seule articulation à la fois (ex : élévations latérales pour l'épaule)."],
  ["Polyarticulaire", "Un exercice qui fait travailler plusieurs muscles et articulations en même temps (ex : squat, développé couché). Ce sont généralement les exercices les plus efficaces pour progresser."],
  ["Gainage", "Le fait de contracter les abdominaux et le tronc pour stabiliser la colonne pendant un effort (comme un ceinturon musculaire naturel)."],
  ["Courbatures (DOMS)", "Douleurs musculaires qui apparaissent 1 à 2 jours après une séance inhabituelle ou intense. C'est normal et ça passe en quelques jours ; ce n'est pas une raison de s'inquiéter."],
  ["Prise supination", "Tenir une barre ou un haltère avec les paumes tournées vers le haut (le ciel)."],
  ["Prise neutre", "Tenir un haltère avec les paumes qui se font face (comme pour tenir un marteau)."],
  ["Fourchette de répétitions", "L'intervalle donné pour un exercice, par exemple \"8-12\". Tu essaies de rester dans cette zone à chaque série."]
];

function renderGlossary() {
  return `
    <div class="day-header">
      <h2>📚 Lexique débutant</h2>
      <p>Tous les mots un peu techniques du programme, expliqués simplement.</p>
    </div>
    <dl>
      ${GLOSSARY_TERMS.map(([term, def]) => `
        <div class="glossary-item">
          <dt>${term}</dt>
          <dd>${def}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

// ---------- Stockage du journal (localStorage) ----------

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateFR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function logKey(dayId, itemId) {
  return `log:${dayId}:${itemId}`;
}

function getLogEntries(dayId, itemId) {
  const raw = localStorage.getItem(logKey(dayId, itemId));
  return raw ? JSON.parse(raw) : [];
}

function saveLogEntries(dayId, itemId, entries) {
  localStorage.setItem(logKey(dayId, itemId), JSON.stringify(entries));
}

function addLogEntry(dayId, itemId, entry) {
  const entries = getLogEntries(dayId, itemId);
  entries.push({ ...entry, ts: Date.now() });
  saveLogEntries(dayId, itemId, entries);
}

function deleteLogEntry(dayId, itemId, ts) {
  const entries = getLogEntries(dayId, itemId).filter(e => e.ts !== ts);
  saveLogEntries(dayId, itemId, entries);
}

// ---------- Composants réutilisables : formulaire de log, historique, graphique ----------

function renderLogSection(dayId, itemId, kind) {
  const entries = getLogEntries(dayId, itemId).slice().sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  const valueLabel = kind === "muscu" ? "Poids utilisé (kg)" : "Durée réalisée (min)";
  return `
    <div class="log-section">
      <h4>📝 Ton journal pour cet exercice</h4>
      <form class="log-form" data-day="${dayId}" data-item="${escapeAttr(itemId)}">
        <div class="log-row">
          <label>Date<input type="date" name="date" value="${todayStr()}" required></label>
          <label>${valueLabel}<input type="number" step="0.5" min="0" name="value" required></label>
          ${kind === "muscu" ? `<label>Répétitions<input type="text" name="reps" placeholder="ex: 12,11,10,9"></label>` : ""}
        </div>
        <label class="log-note">Note (optionnel)<input type="text" name="note" placeholder="ressenti, douleur, énergie..."></label>
        <button type="submit" class="log-submit">Ajouter au journal</button>
      </form>
      ${entries.length ? renderHistoryTable(dayId, itemId, entries, kind) : `<p class="log-empty">Pas encore d'entrée — enregistre ta première séance ci-dessus.</p>`}
      ${entries.length >= 2 ? renderChart(entries, kind, 280, 70) : ""}
    </div>
  `;
}

function renderHistoryTable(dayId, itemId, entries, kind) {
  const rows = entries.map(e => `
    <tr>
      <td>${formatDateFR(e.date)}</td>
      <td>${e.value}${kind === "muscu" ? " kg" : " min"}</td>
      ${kind === "muscu" ? `<td>${e.reps ? escapeHtml(e.reps) : "—"}</td>` : ""}
      <td>${e.note ? escapeHtml(e.note) : "—"}</td>
      <td><button type="button" class="del-log" data-day="${dayId}" data-item="${escapeAttr(itemId)}" data-ts="${e.ts}" title="Supprimer cette entrée">✕</button></td>
    </tr>
  `).join("");
  return `
    <table class="log-table">
      <tr><th>Date</th><th>${kind === "muscu" ? "Poids" : "Durée"}</th>${kind === "muscu" ? "<th>Reps</th>" : ""}<th>Note</th><th></th></tr>
      ${rows}
    </table>
  `;
}

function renderChart(entries, kind, w, h) {
  const asc = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const values = asc.map(e => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 10;
  const stepX = asc.length > 1 ? (w - pad * 2) / (asc.length - 1) : 0;
  const coords = asc.map((e, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((e.value - min) / range) * (h - pad * 2)
  }));
  const points = coords.map(c => `${c.x},${c.y}`).join(" ");
  const unit = kind === "muscu" ? "kg" : "min";
  return `
    <div class="chart-wrap">
      <p class="chart-label">Évolution du ${kind === "muscu" ? "poids" : "temps"} (${formatDateFR(asc[0].date)} → ${formatDateFR(asc[asc.length - 1].date)})</p>
      <svg viewBox="0 0 ${w} ${h}" class="chart-svg" preserveAspectRatio="none">
        <polyline points="${points}" style="fill:none;stroke:var(--accent);stroke-width:2"></polyline>
        ${coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3" style="fill:var(--accent)"></circle>`).join("")}
      </svg>
      <p class="chart-range">min ${min}${unit} · max ${max}${unit}</p>
    </div>
  `;
}

// ---------- Rendu des jours muscu / cardio / repos ----------

function renderExerciseCard(day, ex, idx) {
  const today = todayStr();
  const doneToday = getLogEntries(day.id, ex.name).some(e => e.date === today);
  return `
    <div class="exercise-card ${doneToday ? "done-today" : ""}">
      <div class="exercise-head" data-toggle="${idx}">
        <div class="exercise-title-wrap">
          <p class="exercise-title">${ex.name} ${doneToday ? '<span class="done-badge">✅ fait aujourd\'hui</span>' : ""}</p>
          <p class="exercise-meta">${ex.sets}${ex.weight ? " · " + ex.weight : ""}</p>
          <span class="badge badge-blue">${ex.muscle}</span>
        </div>
        <span class="chevron" data-chevron="${idx}">▶</span>
      </div>
      <div class="exercise-body" data-body="${idx}">
        <h4>Comment faire</h4>
        <ol>${ex.steps.map(s => `<li>${s}</li>`).join("")}</ol>
        ${ex.tip ? `<div class="tip-box">💡 <strong>Astuce :</strong> ${ex.tip}</div>` : ""}
        ${ex.mistake ? `<div class="mistake-box">⚠️ <strong>Erreur à éviter :</strong> ${ex.mistake}</div>` : ""}
        ${renderLogSection(day.id, ex.name, "muscu")}
      </div>
    </div>
  `;
}

function renderMuscuDay(day) {
  const cards = day.exercises.map((ex, i) => renderExerciseCard(day, ex, i)).join("");
  const finisherIdx = day.exercises.length;
  const finisherCard = day.finisher ? renderExerciseCard(day, day.finisher, finisherIdx) : "";
  return `
    <div class="day-header">
      <h2>${day.label} — ${day.title}</h2>
      <p>Clique sur un exercice pour voir les explications et enregistrer ta séance dans le journal.</p>
    </div>
    ${cards}
    ${finisherCard}
  `;
}

function renderCardioDay(day) {
  return `
    <div class="day-header">
      <h2>${day.label} — ${day.title}</h2>
    </div>
    <div class="cardio-card">
      <p>${day.description}</p>
      <div class="tip-box">🎯 <strong>Pourquoi cette séance :</strong> ${day.why}</div>
      ${renderLogSection(day.id, "session", "cardio")}
    </div>
  `;
}

function renderRestDay(day) {
  return `
    <div class="day-header">
      <h2>${day.label} — ${day.title}</h2>
    </div>
    <div class="rest-card">
      <p>${day.description}</p>
      <div class="tip-box">🎯 <strong>Pourquoi ce jour compte :</strong> ${day.why}</div>
    </div>
  `;
}

// ---------- Onglet Journal (historique chronologique global) ----------

function renderJournal() {
  const allEntries = [];
  Object.keys(localStorage)
    .filter(k => k.startsWith("log:"))
    .forEach(key => {
      const parts = key.split(":");
      const dayId = parts[1];
      const itemId = parts.slice(2).join(":");
      const meta = (EXERCISE_INDEX[dayId] && EXERCISE_INDEX[dayId][itemId]) || { name: itemId, kind: "muscu", dayLabel: dayId };
      getLogEntries(dayId, itemId).forEach(e => allEntries.push({ ...e, dayId, itemId, meta }));
    });

  if (!allEntries.length) {
    return `
      <div class="day-header"><h2>📔 Journal de bord</h2></div>
      <div class="intro-block"><p>Ton journal est vide pour l'instant. Enregistre tes séances depuis les onglets des jours pour les voir apparaître ici, classées par date.</p></div>
    `;
  }

  allEntries.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  const byDate = {};
  allEntries.forEach(e => { (byDate[e.date] = byDate[e.date] || []).push(e); });
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return `
    <div class="day-header">
      <h2>📔 Journal de bord</h2>
      <p>L'historique complet de toutes tes séances enregistrées, de la plus récente à la plus ancienne.</p>
    </div>
    ${dates.map(date => `
      <div class="journal-date-block">
        <h3>${formatDateFR(date)}</h3>
        ${byDate[date].map(e => `
          <div class="journal-entry">
            <div class="journal-entry-head">
              <span class="badge badge-grey">${e.meta.dayLabel}</span>
              <strong>${e.meta.name}</strong>
              <span class="journal-value">${e.value}${e.meta.kind === "muscu" ? "kg" : "min"}${e.reps ? " · " + escapeHtml(e.reps) + " reps" : ""}</span>
            </div>
            ${e.note ? `<p class="journal-note">${escapeHtml(e.note)}</p>` : ""}
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}

// ---------- Onglet Progression (courbe par exercice, au choix) ----------

let currentProgressionKey = null;

function progressionOptions() {
  const options = [];
  DAYS.forEach(day => {
    if (day.type === "muscu") {
      const all = day.finisher ? [...day.exercises, day.finisher] : day.exercises;
      all.forEach(ex => options.push({ dayId: day.id, itemId: ex.name, label: `${day.label} — ${ex.name}` }));
    } else if (day.type === "cardio") {
      options.push({ dayId: day.id, itemId: "session", label: `${day.label} — ${day.title}` });
    }
  });
  return options;
}

function renderProgressionTab() {
  const options = progressionOptions();
  const key = currentProgressionKey || `${options[0].dayId}::${options[0].itemId}`;
  const [curDay, curItem] = key.split("::");
  const kind = EXERCISE_INDEX[curDay][curItem].kind;
  const entries = getLogEntries(curDay, curItem).slice().sort((a, b) => a.date.localeCompare(b.date));

  return `
    <div class="day-header">
      <h2>📈 Progression</h2>
      <p>Choisis un exercice pour voir son évolution dans le temps.</p>
    </div>
    <select id="progression-select" class="progression-select">
      ${options.map(o => `<option value="${o.dayId}::${o.itemId}" ${`${o.dayId}::${o.itemId}` === key ? "selected" : ""}>${o.label}</option>`).join("")}
    </select>
    ${entries.length >= 2
      ? renderChart(entries, kind, 600, 180)
      : `<div class="intro-block"><p>Pas encore assez de données pour cet exercice (il faut au moins 2 séances enregistrées). ${entries.length === 1 ? "Tu en as 1 pour l'instant." : "Enregistre tes séances depuis l'onglet du jour correspondant."}</p></div>`
    }
    ${entries.length ? renderHistoryTable(curDay, curItem, entries.slice().reverse(), kind) : ""}
  `;
}

// ---------- Navigation par onglets ----------

let currentDayId = INTRO.id;
const openExercises = new Set();

function renderTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = DAYS.map(d => `
    <button class="tab-btn ${d.id === currentDayId ? "active" : ""}" data-day="${d.id}">${d.label}</button>
  `).join("");
  tabsEl.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentDayId = btn.dataset.day;
      renderTabs();
      renderContent();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderContent() {
  const day = DAYS.find(d => d.id === currentDayId);
  const contentEl = document.getElementById("content");

  if (day.type === "intro") {
    contentEl.innerHTML = renderIntro();
    return;
  }
  if (day.type === "glossaire") {
    contentEl.innerHTML = renderGlossary();
    return;
  }
  if (day.type === "journal") {
    contentEl.innerHTML = renderJournal();
    return;
  }
  if (day.type === "progression") {
    contentEl.innerHTML = renderProgressionTab();
    document.getElementById("progression-select").addEventListener("change", (e) => {
      currentProgressionKey = e.target.value;
      renderContent();
    });
    return;
  }
  if (day.type === "cardio") {
    contentEl.innerHTML = renderCardioDay(day);
    attachLogHandlers(contentEl, day);
    return;
  }
  if (day.type === "repos") {
    contentEl.innerHTML = renderRestDay(day);
    return;
  }

  contentEl.innerHTML = renderMuscuDay(day);

  contentEl.querySelectorAll("[data-toggle]").forEach(head => {
    const idx = head.dataset.toggle;
    const key = `${day.id}:${idx}`;
    const body = contentEl.querySelector(`[data-body="${idx}"]`);
    const chevron = contentEl.querySelector(`[data-chevron="${idx}"]`);
    if (openExercises.has(key)) {
      body.classList.add("open");
      chevron.classList.add("open");
    }
    head.addEventListener("click", () => {
      body.classList.toggle("open");
      chevron.classList.toggle("open");
      if (body.classList.contains("open")) openExercises.add(key);
      else openExercises.delete(key);
    });
  });

  attachLogHandlers(contentEl, day);
}

function attachLogHandlers(contentEl, day) {
  contentEl.querySelectorAll(".log-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const dayId = form.dataset.day;
      const itemId = form.dataset.item;
      const data = new FormData(form);
      addLogEntry(dayId, itemId, {
        date: data.get("date"),
        value: parseFloat(data.get("value")),
        reps: data.get("reps") || "",
        note: data.get("note") || ""
      });
      renderContent();
    });
  });

  contentEl.querySelectorAll(".del-log").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteLogEntry(btn.dataset.day, btn.dataset.item, Number(btn.dataset.ts));
      renderContent();
    });
  });
}

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("Réinitialiser tout ton journal (toutes les séances enregistrées, sur tous les jours) ? Cette action est irréversible.")) return;
  Object.keys(localStorage)
    .filter(k => k.startsWith("log:"))
    .forEach(k => localStorage.removeItem(k));
  renderContent();
});

renderTabs();
renderContent();
