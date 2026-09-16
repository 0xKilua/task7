import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../env.js";

export interface StorageProvider {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  getReadUrl(key: string): Promise<string>;
}

/**
 * Provider S3-compatible (AWS S3, Cloudflare R2, MinIO...). C'est celui
 * utilise en production et dans docker-compose (MinIO).
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(env: Env) {
    this.bucket = env.S3_BUCKET_PHOTOS;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
    });
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async getObject(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Objet introuvable: ${key}`);
    return Buffer.from(bytes);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getReadUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 3600,
    });
  }
}

/**
 * Provider disque local : utilise en developpement sans dependance externe
 * (pas besoin de MinIO/S3 pour lancer l'API). Memes garanties fonctionnelles
 * que le provider S3 pour le reste de l'application, via la meme interface.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly rootDir: string;

  constructor(env: Env) {
    this.rootDir = resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
  }

  private pathFor(key: string): string {
    return join(this.rootDir, key);
  }

  async putObject(key: string, body: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async getObject(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async getReadUrl(key: string): Promise<string> {
    return `local://${key}`;
  }
}

export function createStorageProvider(env: Env): StorageProvider {
  return env.STORAGE_PROVIDER === "s3" ? new S3StorageProvider(env) : new LocalDiskStorageProvider(env);
}

export function buildPhotoStorageKey(userId: string, extension: string): string {
  return `photos/${userId}/${randomUUID()}.${extension}`;
}

export function buildResultStorageKey(userId: string, simulationId: string): string {
  return `results/${userId}/${simulationId}.png`;
}
