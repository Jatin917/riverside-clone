/** @type {import('next').NextConfig} */
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
   typescript: {
    ignoreBuildErrors: true, // ✅ disables type checking during build
  },
     webpack: (config) => {
    config.resolve.alias['@component'] = path.resolve(__dirname, 'app/components');
    return config;
  },
  config: {
    turbopack: true
  }  
};

export default nextConfig;
