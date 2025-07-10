import nextPWA from 'next-pwa';

/** 
 * Initialize next-pwa with its options. 
 * `dest: 'public'` will output your service-worker to public/sw.js 
 */
const withPWA = nextPWA({
  dest: 'public',
  register: true,      // auto-register in the browser
  skipWaiting: true,   // activate new SW as soon as it's ready
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);