import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { Env } from "../../env.js";

export const SIMULATIONS_QUEUE_NAME = "simulations";

export interface SimulationJobData {
  simulationId: string;
}

let queue: Queue<SimulationJobData> | undefined;
let connection: IORedis | undefined;

export function getSimulationsQueue(env: Env): Queue<SimulationJobData> {
  if (!queue) {
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    queue = new Queue<SimulationJobData>(SIMULATIONS_QUEUE_NAME, { connection });
  }
  return queue;
}

export async function closeSimulationsQueue(): Promise<void> {
  await queue?.close();
  await connection?.quit();
  queue = undefined;
  connection = undefined;
}
