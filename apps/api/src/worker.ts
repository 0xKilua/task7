/**
 * Point d'entree du worker de generation (processus separe du serveur
 * HTTP). Consomme la queue BullMQ "simulations" et execute le pipeline
 * reel (services/vision + packages/ai-engine) pour chaque simulation.
 *
 * Lancement : `pnpm --filter @relook/api worker` (ou conteneur dedie en
 * production, voir infra/docker/docker-compose.yml).
 */
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "./env.js";
import { createStorageProvider } from "./lib/storage.js";
import { processSimulationJob } from "./modules/simulations/simulations.processor.js";
import { SIMULATIONS_QUEUE_NAME, type SimulationJobData } from "./modules/simulations/simulations.queue.js";

const env = getEnv();
const storage = createStorageProvider(env);
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker<SimulationJobData>(
  SIMULATIONS_QUEUE_NAME,
  async (job) => {
    await processSimulationJob(env, storage, job.data.simulationId);
  },
  { connection, concurrency: 2 },
);

worker.on("completed", (job) => {
  // eslint-disable-next-line no-console
  console.log(`Simulation ${job.data.simulationId} traitee.`);
});

worker.on("failed", (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`Simulation ${job?.data.simulationId} en erreur:`, err);
});

// eslint-disable-next-line no-console
console.log("Worker de simulations demarre.");
