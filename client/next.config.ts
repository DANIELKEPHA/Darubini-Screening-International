import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    turbopack: {}, // 👈 add this

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "example.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.amazonaws.com",
                port: "",
                pathname: "/**",
            },
        ],
    },

    async headers() {
        return [
            {
                source: '/tinymce/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;