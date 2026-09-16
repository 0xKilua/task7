import type { FastifyInstance } from "fastify";
import { ValidationError } from "../../lib/errors.js";
import { deletePhoto, getOwnedPhoto, listPhotos, uploadPhoto } from "./photos.service.js";

export async function photosRoutes(app: FastifyInstance): Promise<void> {
  app.post("/photos", { preHandler: app.requireAuth }, async (request, reply) => {
    const file = await request.file();
    if (!file) throw new ValidationError("Aucun fichier 'image' envoye.");
    const buffer = await file.toBuffer();

    const result = await uploadPhoto(app.env, app.storage, request.user!.id, buffer, file.filename);
    reply.code(201);
    return result;
  });

  app.get("/photos", { preHandler: app.requireAuth }, async (request) => {
    return listPhotos(request.user!.id);
  });

  app.get("/photos/:id", { preHandler: app.requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    return getOwnedPhoto(request.user!.id, id);
  });

  app.get("/photos/:id/image", { preHandler: app.requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const photo = await getOwnedPhoto(request.user!.id, id);
    const buffer = await app.storage.getObject(photo.storageKey);
    reply.header("Content-Type", "image/jpeg");
    return reply.send(buffer);
  });

  app.delete("/photos/:id", { preHandler: app.requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deletePhoto(app.storage, request.user!.id, id);
    reply.code(204);
  });
}
