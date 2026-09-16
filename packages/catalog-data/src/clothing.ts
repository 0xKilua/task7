import type { ClothingCatalogItem, ClothingType, ClothingCategory } from "@relook/types";

interface ClothingSeed {
  id: string;
  name: string;
  type: ClothingType;
  fit: ClothingCatalogItem["fit"];
  color: string;
  colorHex: string;
  material: string;
  style: string;
  season: ClothingCatalogItem["season"];
  occasion: ClothingCatalogItem["occasion"];
  tags?: string[];
}

function categoryFor(type: ClothingType): ClothingCategory {
  if (type.startsWith("robe")) return "robe";
  const basTypes: ClothingType[] = [
    "jean",
    "pantalon_classique",
    "pantalon_large",
    "pantalon_droit",
    "pantalon_cargo",
    "jogging",
    "legging",
    "jupe_courte",
    "jupe_midi",
    "jupe_longue",
    "short",
    "bermuda",
  ];
  return basTypes.includes(type) ? "bas" : "haut";
}

const SEEDS: ClothingSeed[] = [
  // --- Hauts ---
  { id: "tshirt-blanc-basique", name: "T-shirt blanc basique", type: "tshirt", fit: "regular", color: "blanc", colorHex: "#F5F5F5", material: "coton", style: "casual", season: "toutes_saisons", occasion: "quotidien" },
  { id: "chemise-bleu-ciel", name: "Chemise bleu ciel", type: "chemise", fit: "cintre", color: "bleu ciel", colorHex: "#A9C6E8", material: "popeline de coton", style: "business_casual", season: "toutes_saisons", occasion: "travail" },
  { id: "blouse-fluide-ecru", name: "Blouse fluide ecru", type: "blouse", fit: "ample", color: "ecru", colorHex: "#EFE6D8", material: "viscose", style: "elegant", season: "printemps", occasion: "travail" },
  { id: "polo-marine", name: "Polo marine", type: "polo", fit: "regular", color: "marine", colorHex: "#1F2A44", material: "pique de coton", style: "casual_chic", season: "ete", occasion: "quotidien" },
  { id: "pull-col-rond-camel", name: "Pull col rond camel", type: "pull", fit: "regular", color: "camel", colorHex: "#B08355", material: "laine merinos", style: "casual", season: "automne", occasion: "quotidien" },
  { id: "sweat-gris-chine", name: "Sweat gris chine", type: "sweat", fit: "oversize", color: "gris chine", colorHex: "#9A9A9A", material: "molleton coton", style: "streetwear", season: "automne", occasion: "quotidien" },
  { id: "cardigan-beige-long", name: "Cardigan beige long", type: "cardigan", fit: "ample", color: "beige", colorHex: "#D9C6A5", material: "laine", style: "casual_chic", season: "automne", occasion: "quotidien" },
  { id: "debardeur-noir-cotele", name: "Debardeur noir cotele", type: "debardeur", fit: "ajuste", color: "noir", colorHex: "#161616", material: "cotele coton", style: "basique", season: "ete", occasion: "quotidien" },
  { id: "top-satin-vert", name: "Top satin vert emeraude", type: "top", fit: "cintre", color: "vert emeraude", colorHex: "#0F6B4C", material: "satin", style: "soiree", season: "toutes_saisons", occasion: "soiree" },
  { id: "veste-jean-clair", name: "Veste en jean clair", type: "veste", fit: "regular", color: "bleu clair", colorHex: "#8FA9C7", material: "denim", style: "casual", season: "printemps", occasion: "quotidien" },
  { id: "blazer-noir-structure", name: "Blazer noir structure", type: "blazer", fit: "cintre", color: "noir", colorHex: "#141414", material: "laine melangee", style: "business", season: "toutes_saisons", occasion: "travail" },
  { id: "veste-costume-anthracite", name: "Veste de costume anthracite", type: "veste_costume", fit: "cintre", color: "anthracite", colorHex: "#33373D", material: "laine peignee", style: "formel", season: "toutes_saisons", occasion: "ceremonie" },

  // --- Bas ---
  { id: "jean-droit-brut", name: "Jean droit brut", type: "jean", fit: "droit", color: "bleu brut", colorHex: "#3B4B6B", material: "denim", style: "casual", season: "toutes_saisons", occasion: "quotidien" },
  { id: "pantalon-classique-gris", name: "Pantalon classique gris", type: "pantalon_classique", fit: "droit", color: "gris", colorHex: "#5C5F66", material: "laine legere", style: "business", season: "toutes_saisons", occasion: "travail" },
  { id: "pantalon-large-lin", name: "Pantalon large en lin", type: "pantalon_large", fit: "ample", color: "sable", colorHex: "#D8C9A3", material: "lin", style: "estival", season: "ete", occasion: "vacances" },
  { id: "pantalon-droit-noir", name: "Pantalon droit noir", type: "pantalon_droit", fit: "droit", color: "noir", colorHex: "#151515", material: "polyester melange", style: "business_casual", season: "toutes_saisons", occasion: "travail" },
  { id: "pantalon-cargo-kaki", name: "Pantalon cargo kaki", type: "pantalon_cargo", fit: "regular", color: "kaki", colorHex: "#6B6F4C", material: "coton renforce", style: "utilitaire", season: "toutes_saisons", occasion: "quotidien" },
  { id: "jogging-gris", name: "Jogging gris chine", type: "jogging", fit: "regular", color: "gris chine", colorHex: "#9C9C9C", material: "molleton coton", style: "sport", season: "toutes_saisons", occasion: "sport" },
  { id: "legging-noir", name: "Legging noir technique", type: "legging", fit: "ajuste", color: "noir", colorHex: "#131313", material: "elasthanne", style: "sport", season: "toutes_saisons", occasion: "sport" },
  { id: "jupe-courte-plissee", name: "Jupe courte plissee", type: "jupe_courte", fit: "regular", color: "bordeaux", colorHex: "#6E1E2B", material: "polyester plisse", style: "casual_chic", season: "automne", occasion: "quotidien" },
  { id: "jupe-midi-satinee", name: "Jupe midi satinee", type: "jupe_midi", fit: "droit", color: "vert bouteille", colorHex: "#1F4D3A", material: "satin", style: "elegant", season: "toutes_saisons", occasion: "soiree" },
  { id: "jupe-longue-fluide", name: "Jupe longue fluide", type: "jupe_longue", fit: "ample", color: "terracotta", colorHex: "#B5573A", material: "viscose", style: "boheme", season: "ete", occasion: "vacances" },
  { id: "short-denim", name: "Short en denim", type: "short", fit: "regular", color: "bleu delave", colorHex: "#7C93B8", material: "denim", style: "casual", season: "ete", occasion: "vacances" },
  { id: "bermuda-beige", name: "Bermuda beige", type: "bermuda", fit: "regular", color: "beige", colorHex: "#D3C0A0", material: "coton", style: "casual", season: "ete", occasion: "quotidien" },

  // --- Robes ---
  { id: "robe-courte-fleurie", name: "Robe courte fleurie", type: "robe_courte", fit: "cintre", color: "imprime floral", colorHex: "#E4A0B0", material: "viscose", style: "romantique", season: "ete", occasion: "quotidien" },
  { id: "robe-midi-cotelee", name: "Robe midi cotelee", type: "robe_midi", fit: "ajuste", color: "moutarde", colorHex: "#C99A2E", material: "maille cotelee", style: "casual_chic", season: "automne", occasion: "quotidien" },
  { id: "robe-longue-boheme", name: "Robe longue boheme", type: "robe_longue", fit: "ample", color: "bleu indigo", colorHex: "#33507A", material: "viscose imprimee", style: "boheme", season: "ete", occasion: "vacances" },
  { id: "robe-droite-noire", name: "Robe droite noire", type: "robe_droite", fit: "droit", color: "noir", colorHex: "#151515", material: "crepe", style: "minimaliste", season: "toutes_saisons", occasion: "travail" },
  { id: "robe-fluide-imprimee", name: "Robe fluide imprimee", type: "robe_fluide", fit: "ample", color: "imprime graphique", colorHex: "#3E6E8E", material: "voile de coton", style: "casual_chic", season: "ete", occasion: "quotidien" },
  { id: "robe-soiree-rouge", name: "Robe de soiree rouge", type: "robe_soiree", fit: "cintre", color: "rouge", colorHex: "#8E1B2A", material: "satin", style: "soiree", season: "toutes_saisons", occasion: "soiree" },
  { id: "robe-decontractee-rayee", name: "Robe decontractee rayee", type: "robe_decontractee", fit: "regular", color: "rayures marine/blanc", colorHex: "#B7C2D6", material: "jersey coton", style: "casual", season: "ete", occasion: "quotidien" },
];

export const CLOTHING_ITEMS: ClothingCatalogItem[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  category: categoryFor(seed.type),
  type: seed.type,
  fit: seed.fit,
  color: seed.color,
  colorHex: seed.colorHex,
  material: seed.material,
  style: seed.style,
  season: seed.season,
  occasion: seed.occasion,
  tags: seed.tags ?? [],
  garmentImageUrl: `/catalog/clothing/${seed.id}.jpg`,
}));
