export default function IntroPage() {
  return (
    <>
      <div className="panel">
        <h2>👋 Bienvenue, débutant·e</h2>
        <p>Ce programme est prévu pour progresser en toute sécurité même sans expérience de musculation. Voici les règles à connaître avant ta première séance.</p>
      </div>
      <div className="panel">
        <h3>📖 Comment lire une fiche d&apos;exercice</h3>
        <p>Quand tu vois <span className="mono">4 × 8–12</span>, ça veut dire :</p>
        <ul>
          <li>Tu fais le mouvement <strong>8 à 12 fois de suite</strong> → c&apos;est <strong>une série</strong>.</li>
          <li>Tu te reposes environ <strong>60 à 90 secondes</strong>.</li>
          <li>Tu recommences jusqu&apos;à avoir fait <strong>4 séries</strong> au total.</li>
        </ul>
        <p>Vise le haut de la fourchette en gardant une bonne technique. Si tu n&apos;atteins même pas le bas de la fourchette, la charge est trop lourde.</p>
      </div>
      <div className="panel">
        <h3>⚖️ Choisir le bon poids</h3>
        <ul>
          <li>Tu dois finir toutes tes répétitions avec une <strong>bonne technique</strong>, sans te tordre ni te balancer.</li>
          <li>Les 2 dernières répétitions de chaque série doivent être <strong>difficiles mais faisables</strong>.</li>
          <li>Tu termines en te disant &quot;j&apos;aurais pu en faire 10 de plus&quot; → trop léger. Tu ne finis pas la série → trop lourd.</li>
        </ul>
      </div>
      <div className="panel">
        <h3>🛡️ Sécurité pour débuter</h3>
        <ul>
          <li><strong>La technique avant le poids.</strong> Un mouvement bien fait à 5 kg vaut mieux qu&apos;un mouvement bâclé à 15 kg.</li>
          <li><strong>Respire</strong> : souffle à l&apos;effort, inspire au retour. Ne bloque jamais ta respiration.</li>
          <li><strong>Échauffe-toi</strong> avant les séries lourdes (articulations + 5 minutes de cardio léger suffisent).</li>
          <li><strong>Repose-toi 60-90 s entre les séries</strong>, et un jour complet avant de refaire le même groupe musculaire.</li>
          <li>Une petite courbature 1-2 jours après est normale (DOMS, voir le lexique). Une <strong>douleur vive dans une articulation</strong> ne l&apos;est pas : arrête et laisse reposer.</li>
        </ul>
      </div>
      <div className="panel">
        <h3>📈 Progresser sans se blesser</h3>
        <ul>
          <li>Quand tu atteins facilement le haut de la fourchette sur <strong>toutes tes séries</strong>, augmente légèrement la charge la fois suivante.</li>
          <li><strong>Curl marteau (10 kg)</strong> et <strong>échauffement biceps (5 kg)</strong> : haltères à poids fixe. Progresse par les répétitions, le tempo, ou une pause en haut du mouvement.</li>
          <li><strong>Barre EZ</strong> : ajoute un disque quand 20 kg devient facile sur toute la série.</li>
          <li>Vise 7 à 8 h de sommeil par nuit — c&apos;est pendant le sommeil que le muscle se répare.</li>
        </ul>
      </div>
      <div className="panel">
        <h3>🗓️ Progression sur 8 semaines</h3>
        <table className="week-table">
          <tbody>
            <tr><th>Semaines</th><th>Objectif</th></tr>
            <tr><td>1–2</td><td>Apprendre les mouvements, charges légères à modérées</td></tr>
            <tr><td>3–4</td><td>Augmenter progressivement (+1-2 kg quand possible, sinon reps/tempo)</td></tr>
            <tr><td>5–6</td><td>Consolider, viser le haut de fourchette sur la majorité des séries</td></tr>
            <tr><td>7–8</td><td>Pic de forme, semaine plus légère en 8 si fatigue</td></tr>
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h3>🎒 Ton matériel</h3>
        <ul>
          <li><strong>2 haltères de 10 kg</strong> → travail principal des biceps (curl marteau)</li>
          <li><strong>2 haltères de 5 kg</strong> → échauffement des biceps</li>
          <li><strong>Barre EZ chargée à 20 kg</strong> → curl, rowing, extension triceps, squat</li>
        </ul>
      </div>
    </>
  );
}
