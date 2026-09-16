import { buildApp } from "./app.js";
import { getEnv } from "./env.js";
import { createStorageProvider } from "./lib/storage.js";

async function main() {
  const env = getEnv();
  const storage = createStorageProvider(env);
  const app = await buildApp(env, storage);

  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Echec du demarrage du serveur API:", error);
  process.exit(1);
});
