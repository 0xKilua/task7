/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    // Les guides officiels dépassent largement la limite par défaut de 1 Mo.
    serverActions: { bodySizeLimit: '50mb' },
  },
};

export default nextConfig;
