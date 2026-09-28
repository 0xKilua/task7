// Politique de sécurité du contenu : tout vient de l'application elle-même. Les scripts et
// styles en ligne restent permis, Next.js en insère pour l'hydratation et le rendu.
const POLITIQUE_CONTENU = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Modules natifs ou lourds chargés tels quels par Node, sans passer par le bundler.
  serverExternalPackages: ['better-sqlite3', 'onnxruntime-node', '@huggingface/tokenizers'],
  // Ne pas annoncer le framework employé.
  poweredByHeader: false,
  experimental: {
    // Les guides officiels dépassent largement la limite par défaut de 1 Mo.
    serverActions: { bodySizeLimit: '50mb' },
    // Le filtre d'accès (src/proxy.ts) met en mémoire le corps des requêtes : même limite.
    proxyClientMaxBodySize: '50mb',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: POLITIQUE_CONTENU },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Les liens vers les sources officielles ne transmettent pas l'adresse de la page.
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
