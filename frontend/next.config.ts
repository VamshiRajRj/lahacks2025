import withPWA from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  dest: 'public',
  disable: isDev,
  devIndicators: false,
}

export default nextConfig