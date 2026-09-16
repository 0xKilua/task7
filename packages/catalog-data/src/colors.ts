import { hexToLab, type HairColorCatalogItem } from "@relook/types";

interface ColorSeed {
  id: string;
  name: string;
  baseColor: HairColorCatalogItem["baseColor"];
  technique: HairColorCatalogItem["technique"];
  swatchHex: string;
  secondaryHex?: string;
  tags?: string[];
}

const SEEDS: ColorSeed[] = [
  { id: "blond", name: "Blond", baseColor: "blond", technique: "uniforme", swatchHex: "#E8C994" },
  {
    id: "blond-clair",
    name: "Blond clair",
    baseColor: "blond_clair",
    technique: "uniforme",
    swatchHex: "#F0DDB0",
  },
  {
    id: "blond-fonce",
    name: "Blond fonce",
    baseColor: "blond_fonce",
    technique: "uniforme",
    swatchHex: "#C9A468",
  },
  {
    id: "blond-polaire",
    name: "Blond polaire",
    baseColor: "blond_polaire",
    technique: "uniforme",
    swatchHex: "#F3E9D2",
  },
  {
    id: "chatain-clair",
    name: "Chatain clair",
    baseColor: "chatain_clair",
    technique: "uniforme",
    swatchHex: "#A47449",
  },
  { id: "chatain", name: "Chatain", baseColor: "chatain", technique: "uniforme", swatchHex: "#6F4E37" },
  {
    id: "chatain-fonce",
    name: "Chatain fonce",
    baseColor: "chatain_fonce",
    technique: "uniforme",
    swatchHex: "#4B3221",
  },
  { id: "brun", name: "Brun", baseColor: "brun", technique: "uniforme", swatchHex: "#3B2618" },
  { id: "noir", name: "Noir", baseColor: "noir", technique: "uniforme", swatchHex: "#14100D" },
  { id: "roux", name: "Roux", baseColor: "roux", technique: "uniforme", swatchHex: "#B5501A" },
  { id: "cuivre", name: "Cuivre", baseColor: "cuivre", technique: "uniforme", swatchHex: "#B76E33" },
  { id: "auburn", name: "Auburn", baseColor: "auburn", technique: "uniforme", swatchHex: "#6B2E1F" },
  { id: "gris", name: "Gris", baseColor: "gris", technique: "uniforme", swatchHex: "#9C9C9C" },
  { id: "blanc", name: "Blanc", baseColor: "blanc", technique: "uniforme", swatchHex: "#EDEDED" },
  {
    id: "meches-blond-sur-chatain",
    name: "Meches blondes sur base chatain",
    baseColor: "chatain",
    technique: "meches",
    swatchHex: "#6F4E37",
    secondaryHex: "#F0DDB0",
    tags: ["contraste_moyen"],
  },
  {
    id: "balayage-cuivre-sur-brun",
    name: "Balayage cuivre sur base brune",
    baseColor: "brun",
    technique: "balayage",
    swatchHex: "#3B2618",
    secondaryHex: "#B76E33",
    tags: ["degrade_naturel"],
  },
  {
    id: "ombre-blond-sur-noir",
    name: "Ombre blond sur racines noires",
    baseColor: "noir",
    technique: "ombre",
    swatchHex: "#14100D",
    secondaryHex: "#E8C994",
    tags: ["fort_contraste"],
  },
  {
    id: "degrade-roux-sur-chatain-fonce",
    name: "Degrade de couleur roux sur chatain fonce",
    baseColor: "chatain_fonce",
    technique: "degrade_couleur",
    swatchHex: "#4B3221",
    secondaryHex: "#B5501A",
  },
  {
    id: "racines-brunes-longueurs-polaires",
    name: "Racines differentes : brun / blond polaire",
    baseColor: "brun",
    technique: "racines_differentes",
    swatchHex: "#3B2618",
    secondaryHex: "#F3E9D2",
    tags: ["effet_shadow_root"],
  },
  {
    id: "bicolore-noir-gris",
    name: "Bicolore noir et gris graphique",
    baseColor: "noir",
    technique: "bicolore",
    swatchHex: "#14100D",
    secondaryHex: "#9C9C9C",
    tags: ["graphique", "affirme"],
  },
];

export const HAIR_COLORS: HairColorCatalogItem[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  baseColor: seed.baseColor,
  technique: seed.technique,
  targetLab: hexToLab(seed.swatchHex),
  secondaryLab: seed.secondaryHex ? hexToLab(seed.secondaryHex) : undefined,
  tags: seed.tags ?? [],
  swatchHex: seed.swatchHex,
}));
