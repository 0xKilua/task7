-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "PhotoFraming" AS ENUM ('portrait', 'buste', 'demi_corps', 'pied_a_tete', 'indetermine');

-- CreateEnum
CREATE TYPE "SimulationModule" AS ENUM ('coiffure', 'couleur', 'vetements', 'silhouette');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('queued', 'analyzing', 'preparing', 'generating', 'finalizing', 'completed', 'failed', 'provider_not_configured');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "referenceWeightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "framing" "PhotoFraming" NOT NULL DEFAULT 'indetermine',
    "faceDetected" BOOLEAN NOT NULL DEFAULT false,
    "faceCount" INTEGER NOT NULL DEFAULT 0,
    "bodyDetected" BOOLEAN NOT NULL DEFAULT false,
    "fullBodyVisible" BOOLEAN NOT NULL DEFAULT false,
    "sharpnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "module" "SimulationModule" NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'queued',
    "requestJson" JSONB NOT NULL,
    "resultStorageKey" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogHairstyle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "trendSeason" TEXT,
    "trendSourceUrl" TEXT,
    "referenceImageUrl" TEXT NOT NULL,
    "transformParams" JSONB NOT NULL,
    "suitableForFraming" JSONB NOT NULL DEFAULT '["portrait","buste"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogHairstyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogHairColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseColor" TEXT NOT NULL,
    "technique" TEXT NOT NULL,
    "targetLab" JSONB NOT NULL,
    "secondaryLab" JSONB,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "swatchHex" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogHairColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogClothing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fit" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT,
    "material" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "garmentImageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogClothing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "Photo_expiresAt_idx" ON "Photo"("expiresAt");

-- CreateIndex
CREATE INDEX "Simulation_userId_createdAt_idx" ON "Simulation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Simulation_photoId_idx" ON "Simulation"("photoId");

-- CreateIndex
CREATE INDEX "Simulation_status_idx" ON "Simulation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_simulationId_key" ON "Favorite"("userId", "simulationId");

-- CreateIndex
CREATE INDEX "CatalogHairstyle_length_idx" ON "CatalogHairstyle"("length");

-- CreateIndex
CREATE INDEX "CatalogHairstyle_family_idx" ON "CatalogHairstyle"("family");

-- CreateIndex
CREATE INDEX "CatalogHairColor_baseColor_idx" ON "CatalogHairColor"("baseColor");

-- CreateIndex
CREATE INDEX "CatalogHairColor_technique_idx" ON "CatalogHairColor"("technique");

-- CreateIndex
CREATE INDEX "CatalogClothing_category_idx" ON "CatalogClothing"("category");

-- CreateIndex
CREATE INDEX "CatalogClothing_type_idx" ON "CatalogClothing"("type");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
