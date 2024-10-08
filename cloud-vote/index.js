//This Google Cloud serverless function handles saving visitor votes on videos
const { Redis } = require('@upstash/redis'); // Use require
const functions = require('@google-cloud/functions-framework');

const getLatestVotes = require('./getLatestVotes');


const redis = new Redis({
    url: process.env.UPSTASH_URL,
    token: process.env.UPSTASH_TOKEN,
});

const allowedOrigins = ['http://localhost',
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:5000', 'http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003', 'http://localhost:5004',

    'https://videyo.com',
    'http://videyo.com']

const RECENT_LOG_SIZE = 1000;
const VOTE_EXPIRATION_SECONDS = 3600;

//FOR CLIENT-SIDE:
function getCurrentShortTimestamp() {
    return Date.now() - 1717292613124;
}

//FOR CLIENT-SIDE:
function genSecurityKey() {
    const timestamp = getCurrentShortTimestamp();
    const checkDigits = generateCheckDigits(timestamp); // Calculate check digits
    return `${timestamp}-${checkDigits}`;
}

//FOR CLIENT-SIDE:
function generateCheckDigits(timestamp) {
    // Simple checksum algorithm:
    const digits = timestamp.toString().split('');
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        sum += parseInt(digits[i], 10);
    }
    return sum % 10000; // 4-digit checksum for a little more security
}


function generateVoteKey(siteId, itemId, userAgent, userIp) {
    return `vote:${siteId}:${itemId}:${userAgent}:${userIp}`;
}

const VALIDITY_MINUTES = 3;

function isValidSecurityKey(securityKey) {

    return true; //for debug

    const [timestampString, checkDigits] = securityKey.split('-');
    const timestamp = parseInt(timestampString, 10);
    const now = getCurrentShortTimestamp();
    const validityWindow = VALIDITY_MINUTES * 60 * 1000;

    // Check if the timestamp is valid and the check digits match
    return (
        !isNaN(timestamp) &&
        !isNaN(checkDigits) &&
        (now - timestamp) <= validityWindow &&
        parseInt(checkDigits, 10) === generateCheckDigits(timestamp) // Check if the checksums match
    );
}

functions.http('handleVote', async (req, res) => {
    let response = { success: false, error: false, code: 200 }; // Start with a basic response

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    } else {
        response.code = 403;
        response.error = 'Invalid origin';
        return res.status(200).json(response);
    }

    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '0');
        return res.status(204).send('');
    } else if (req.method === 'GET') { //Get is not valid
        response.error = 'GET Method Not Allowed';
        response.code = 405;
    } else if (req.method !== 'POST') {
        response.code = 405;
        response.error = 'That Method is Not Allowed';
    } else { // POST method


        const { siteId, itemId, voteType, securityKey } = req.body;

        if (!securityKey || !isValidSecurityKey(securityKey)) {
            response.code = 403;
            response.error = 'Invalid security key';
            return res.status(200).json(response);
        }

        const userAgent = req.get('user-agent');
        const userIp = req.get('x-forwarded-for') || req.headers['fastly-client-ip'] || req.socket.remoteAddress;
        const voteKey = generateVoteKey(siteId, itemId, userAgent, userIp);

        try {
            if (await redis.exists(voteKey)) {
                response.code = 409;
                response.error = 'Vote already recorded';
            } else {
                if (voteType === 'upvote') {
                    await redis.hincrby(`votes:${siteId}:${itemId}:up`, 'votes', 1);
                } else if (voteType === 'downvote') {
                    await redis.hincrby(`votes:${siteId}:${itemId}:down`, 'votes', 1);
                }

                await redis.set(voteKey, '1', { ex: VOTE_EXPIRATION_SECONDS });
                await redis.lpush(`recent_votes:${siteId}:${itemId}`, `${voteType} by ${userIp} at ${new Date().toISOString()}`);
                await redis.ltrim(`recent_votes:${siteId}:${itemId}`, 0, RECENT_LOG_SIZE - 1);

                response.success = true;
            }
        } catch (error) {
            console.error("Error handling vote:", error);
            response.code = 500;
            response.error = 'Internal Server Error ' + JSON.stringify(error);
        }

    }

    res.status(200).json(response); // Always return 200
});


functions.http('getLatestVotes', async (req, res) => {
    let response = { success: false, error: false, code: 200 }; // Start with a basic response

    let data = await getLatestVotes();
    response.success = true;
    response.data = data;
    res.status(200).json(response); // Always return 200
});









//npm run watch
//gcloud functions deploy handleVote --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=handleVote --trigger-http --project secret-descent-94518 --timeout=10s --max-instances=2 --allow-unauthenticated
//gcloud functions deploy getLatestVotes --gen2 --runtime=nodejs20 --region=us-central1 --source=. --entry-point=getLatestVotes --trigger-http --project secret-descent-94518 --timeout=20s --max-instances=2 --allow-unauthenticated