/** @type {import('next').NextConfig} */
const nextConfig = {
     webpack: (config) => {
    config.resolve.alias['@component'] = path.resolve(__dirname, 'app/components');
    return config;
  },
};

export default nextConfig;
