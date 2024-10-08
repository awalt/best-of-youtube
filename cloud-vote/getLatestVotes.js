const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.UPSTASH_URL,
    token: process.env.UPSTASH_TOKEN,
});

async function getLatestVotes(siteId = 'videyo') {
    return new Promise(async (resolve, reject) => {

        let cursor = 0;
        let allKeys = [];

        // Scan for all keys matching the pattern
        do {
            const [nextCursor, keys] = await redis.scan(cursor, {
                match: `recent_votes:${siteId}:*`,
                count: 5
            });
            cursor = nextCursor;
            allKeys = allKeys.concat(keys);
        } while (cursor !== '0');

        let allVotes = [];

        // Fetch the latest votes for each key
        for (const key of allKeys) {
            const votes = await redis.lrange(key, 0, -1);
            allVotes = allVotes.concat(votes);
        }

        console.log('All votes:', allVotes);

        // Sort all votes by timestamp (assuming the timestamp is part of the vote key)
        allVotes.sort((a, b) => {
            const timestampA = parseInt(a.split(':').pop());
            const timestampB = parseInt(b.split(':').pop());
            return timestampB - timestampA;
        });

        // Get the latest 10 votes
        const latest10Votes = allVotes.slice(0, 10);

        // Fetch vote details
        const voteDetails = await Promise.all(latest10Votes.map(async (voteKey) => {
            const [_, siteId, itemId, userAgent, userIp] = voteKey.split(':');
            const voteType = await redis.get(voteKey);
            return {
                voteKey: voteKey,
                siteId,
                itemId,
                userAgent,
                userIp,
                voteType,
                timestamp: new Date(parseInt(voteKey.split(':').pop())).toISOString()
            };
        }));

        return resolve(voteDetails);
    })
}

// Example usage
if (1 == 0)
    getLatestVotes().then(votes => {
        console.log('Latest 10 votes:', JSON.stringify(votes, null, 2));
    }).catch(error => {
        console.error('Error fetching latest votes:', error);
    });

module.exports = getLatestVotes;