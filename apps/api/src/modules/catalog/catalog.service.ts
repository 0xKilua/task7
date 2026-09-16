import { prisma } from "@relook/db";
import type { ClothingCatalogItem, HairColorCatalogItem, HairstyleCatalogItem } from "@relook/types";
import { NotFoundError } from "../../lib/errors.js";

function hairstyleFromRow(row: {
  id: string;
  name: string;
  description: string;
  length: string;
  texture: string;
  family: string;
  tags: unknown;
  trendSeason: string | null;
  trendSourceUrl: string | null;
  referenceImageUrl: string;
  transformParams: unknown;
  suitableForFraming: unknown;
}): HairstyleCatalogItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    length: row.length as HairstyleCatalogItem["length"],
    texture: row.texture as HairstyleCatalogItem["texture"],
    family: row.family as HairstyleCatalogItem["family"],
    tags: row.tags as string[],
    trend:
      row.trendSeason && row.trendSourceUrl
        ? { season: row.trendSeason, source: row.trendSourceUrl }
        : undefined,
    referenceImageUrl: row.referenceImageUrl,
    transformParams: row.transformParams as HairstyleCatalogItem["transformParams"],
    suitableForFraming: row.suitableForFraming as HairstyleCatalogItem["suitableForFraming"],
  };
}

export async function listHairstyles(filters: { length?: string; family?: string } = {}) {
  const rows = await prisma.catalogHairstyle.findMany({
    where: { isActive: true, length: filters.length, family: filters.family },
    orderBy: { name: "asc" },
  });
  return rows.map(hairstyleFromRow);
}

export async function upsertHairstyle(item: HairstyleCatalogItem) {
  return prisma.catalogHairstyle.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      name: item.name,
      description: item.description,
      length: item.length,
      texture: item.texture,
      family: item.family,
      tags: item.tags,
      trendSeason: item.trend?.season,
      trendSourceUrl: item.trend?.source,
      referenceImageUrl: item.referenceImageUrl,
      transformParams: item.transformParams,
      suitableForFraming: item.suitableForFraming,
    },
    update: {
      name: item.name,
      description: item.description,
      length: item.length,
      texture: item.texture,
      family: item.family,
      tags: item.tags,
      trendSeason: item.trend?.season,
      trendSourceUrl: item.trend?.source,
      referenceImageUrl: item.referenceImageUrl,
      transformParams: item.transformParams,
      suitableForFraming: item.suitableForFraming,
    },
  });
}

export async function deleteHairstyle(id: string) {
  const existing = await prisma.catalogHairstyle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Coiffure introuvable.");
  await prisma.catalogHairstyle.delete({ where: { id } });
}

function colorFromRow(row: {
  id: string;
  name: string;
  baseColor: string;
  technique: string;
  targetLab: unknown;
  secondaryLab: unknown;
  tags: unknown;
  swatchHex: string;
}): HairColorCatalogItem {
  return {
    id: row.id,
    name: row.name,
    baseColor: row.baseColor as HairColorCatalogItem["baseColor"],
    technique: row.technique as HairColorCatalogItem["technique"],
    targetLab: row.targetLab as HairColorCatalogItem["targetLab"],
    secondaryLab: (row.secondaryLab as HairColorCatalogItem["secondaryLab"]) ?? undefined,
    tags: row.tags as string[],
    swatchHex: row.swatchHex,
  };
}

export async function listColors(filters: { baseColor?: string; technique?: string } = {}) {
  const rows = await prisma.catalogHairColor.findMany({
    where: { isActive: true, baseColor: filters.baseColor, technique: filters.technique },
    orderBy: { name: "asc" },
  });
  return rows.map(colorFromRow);
}

export async function upsertColor(item: HairColorCatalogItem) {
  return prisma.catalogHairColor.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      name: item.name,
      baseColor: item.baseColor,
      technique: item.technique,
      targetLab: item.targetLab,
      secondaryLab: item.secondaryLab,
      tags: item.tags,
      swatchHex: item.swatchHex,
    },
    update: {
      name: item.name,
      baseColor: item.baseColor,
      technique: item.technique,
      targetLab: item.targetLab,
      secondaryLab: item.secondaryLab,
      tags: item.tags,
      swatchHex: item.swatchHex,
    },
  });
}

export async function deleteColor(id: string) {
  const existing = await prisma.catalogHairColor.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Couleur introuvable.");
  await prisma.catalogHairColor.delete({ where: { id } });
}

function clothingFromRow(row: {
  id: string;
  name: string;
  category: string;
  type: string;
  fit: string;
  color: string;
  colorHex: string | null;
  material: string;
  style: string;
  season: string;
  occasion: string;
  tags: unknown;
  garmentImageUrl: string;
}): ClothingCatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ClothingCatalogItem["category"],
    type: row.type as ClothingCatalogItem["type"],
    fit: row.fit as ClothingCatalogItem["fit"],
    color: row.color,
    colorHex: row.colorHex ?? undefined,
    material: row.material,
    style: row.style,
    season: row.season as ClothingCatalogItem["season"],
    occasion: row.occasion as ClothingCatalogItem["occasion"],
    tags: row.tags as string[],
    garmentImageUrl: row.garmentImageUrl,
  };
}

export async function listClothing(
  filters: { category?: string; type?: string; season?: string; occasion?: string } = {},
) {
  const rows = await prisma.catalogClothing.findMany({
    where: {
      isActive: true,
      category: filters.category,
      type: filters.type,
      season: filters.season,
      occasion: filters.occasion,
    },
    orderBy: { name: "asc" },
  });
  return rows.map(clothingFromRow);
}

export async function upsertClothing(item: ClothingCatalogItem) {
  return prisma.catalogClothing.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      fit: item.fit,
      color: item.color,
      colorHex: item.colorHex,
      material: item.material,
      style: item.style,
      season: item.season,
      occasion: item.occasion,
      tags: item.tags,
      garmentImageUrl: item.garmentImageUrl,
    },
    update: {
      name: item.name,
      category: item.category,
      type: item.type,
      fit: item.fit,
      color: item.color,
      colorHex: item.colorHex,
      material: item.material,
      style: item.style,
      season: item.season,
      occasion: item.occasion,
      tags: item.tags,
      garmentImageUrl: item.garmentImageUrl,
    },
  });
}

export async function deleteClothing(id: string) {
  const existing = await prisma.catalogClothing.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Vetement introuvable.");
  await prisma.catalogClothing.delete({ where: { id } });
}
