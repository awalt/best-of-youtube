import CopyPlugin from 'copy-webpack-plugin';
import fs from 'fs';
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['i.ytimg.com'],
    },
    webpack: (config, { isServer }) => {
        // Only run in server mode
        if (isServer) {
            const protosDir = path.join(process.cwd(), '.next', 'server', 'protos');
            if (!fs.existsSync(protosDir)) {
                fs.mkdirSync(protosDir, { recursive: true });
            }

            process.env.TZ = 'America/New_York';
            
            config.plugins.push(
                new CopyPlugin({
                    patterns: [
                        {
                            from: 'node_modules/@google-cloud/datastore/build/protos',
                            to: protosDir,
                        },
                    ],
                })
            );
        }
        return config;
    },
};

export default nextConfig;
