// purge-cloudflare-cache.js
import { config } from 'dotenv';

config({ path: '.env.local' });

const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function purgeCache() {
    try {
        console.log("Attempting to purge Cloudflare cache...");
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ purge_everything: true }),
            }
        );

        const data = await response.json();

        if (data.success) {
            console.log('Cloudflare cache purged successfully');
        } else {
            console.error('Failed to purge Cloudflare cache:', data.errors);
        }
    } catch (error) {
        console.error('Error purging Cloudflare cache:', error.message);
    }
}

purgeCache();