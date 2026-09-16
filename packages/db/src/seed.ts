import { HAIRSTYLES, HAIR_COLORS, CLOTHING_ITEMS } from "@relook/catalog-data";
import { prisma } from "./index.js";

async function seedHairstyles() {
  for (const item of HAIRSTYLES) {
    await prisma.catalogHairstyle.upsert({
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
}

async function seedColors() {
  for (const item of HAIR_COLORS) {
    await prisma.catalogHairColor.upsert({
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
}

async function seedClothing() {
  for (const item of CLOTHING_ITEMS) {
    await prisma.catalogClothing.upsert({
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
}

async function main() {
  await seedHairstyles();
  await seedColors();
  await seedClothing();
  // eslint-disable-next-line no-console
  console.log(
    `Catalogue initialise : ${HAIRSTYLES.length} coiffures, ${HAIR_COLORS.length} couleurs, ${CLOTHING_ITEMS.length} vetements.`,
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
