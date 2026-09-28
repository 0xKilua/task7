/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Modules natifs ou lourds chargés tels quels par Node, sans passer par le bundler.
    serverComponentsExternalPackages: ['better-sqlite3', 'onnxruntime-node', '@huggingface/tokenizers'],
    // Les guides officiels dépassent largement la limite par défaut de 1 Mo.
    serverActions: { bodySizeLimit: '50mb' },
    // src/instrumentation.ts : indexation par le sens lancée au démarrage du serveur.
    instrumentationHook: true,
  },
};

export default nextConfig;
