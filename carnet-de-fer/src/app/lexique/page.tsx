import { GLOSSARY_TERMS } from "@/data/program";

export default function GlossaryPage() {
  return (
    <>
      <div className="day-head">
        <span className="eyebrow rest">Référence</span>
        <h2>Lexique débutant</h2>
        <p className="sub">Tous les mots techniques du programme, expliqués simplement.</p>
      </div>
      <dl className="glossary">
        {GLOSSARY_TERMS.map(([term, def]) => (
          <div className="glossary-item" key={term}>
            <dt>{term}</dt>
            <dd>{def}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
