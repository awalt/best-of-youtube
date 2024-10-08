//set nodejs timezone to US/Eastern
const timezone = 'America/New_York'; // US/Eastern timezone
process.env.TZ = timezone;

const fs = require('fs');
const { subDays } = require('date-fns');
const moment = require('moment-timezone');


console.log("Starting");

const storage = require('./storage.js');
const { get } = require('underscore');

async function run(model, input) {
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT}/ai/run/${model}`,
        {
            headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_BEARER}` },
            method: "POST",
            body: JSON.stringify(input),
        }
    );
    const result = await response.json();
    return result;
}

const truncateContent = (content, maxLength) => {
    if (typeof content == "undefined" || !content)
        return '';

    if (content.length > maxLength) {
        return content.substring(0, maxLength) + '... [truncated]';
    }
    return content;
};

const main = async () => {
    return new Promise(async (resolve, reject) => {

        //Turn date back N day in the past
        const N = 1;


        const date = endMoment = moment.tz(timezone).subtract(N, 'days').startOf('day');
        const startMoment = endMoment.clone().subtract(1, 'days');

        console.log({ startMoment: startMoment.toISOString(), endMoment: endMoment.toISOString() });

        //Check if we already have this date's videos
        const existingTop5Videos = await storage.checkTop5VideosByDate(startMoment, endMoment);
        if (existingTop5Videos) {
            console.log("Already have top 5 videos for this date. Returning existing top 5 videos.");
            return resolve(existingTop5Videos);

        }



        let videos = await storage.getVideosInDateRange(startMoment.toDate(), endMoment.toDate());
        console.log(`Number of videos: ${videos.length}`)

        //Order videos by importance score, then only keep the top 25 most important
        if (videos.length > 25)
            videos = videos.sort((a, b) => b.videoImportanceScore - a.videoImportanceScore).slice(0, 25);


        //only keep videos where  Video Importance Score >
        videos = videos.filter(video => video.videoImportanceScore > 0.3);


        const maxDescriptionLength = 150;
        const maxTranscriptLength = 400;

        let prompt = `
VIDEOS: 
${videos.map(video => `
    Video ID: ${video.videoId}
    Title: ${video.title}
    Description: ${truncateContent(video.description, maxDescriptionLength)}
    Transcript: ${truncateContent(video.transcript, maxTranscriptLength)}
    Video Importance Score: ${video.videoImportanceScore}
    Channel Title: ${video.channelTitle}
    Like Count: ${video.likeCount}
    View Count: ${video.viewCount}
    Favorite Count: ${video.favoriteCount}
    Comment Count: ${video.commentCount}
    Post Description: ${video.postDescription || 'N/A'}
    Post Title: ${video.postTitle}
    `).join('\n\n')}
`;

        //console.log("All done", { videos });

        fs.writeFileSync('./promptTop5.txt', prompt);


        console.log("Prompt size:" + prompt.length);

        if (prompt.length > 6144) {
            console.log("PROMPT TOO LONG. Need to truncate long stuff like the transcripts could be too long.");
            videos = videos.filter(video => video.videoImportanceScore > 0.4);

            prompt = `
VIDEOS: 
${videos.map(video => `
    Video ID: ${video.videoId}
    Title: ${video.title}
    Description: ${truncateContent(video.description, maxDescriptionLength / 2)}
    Transcript: ${truncateContent(video.transcript, maxTranscriptLength / 2)}
    Video Importance Score: ${video.videoImportanceScore}
    Channel Title: ${video.channelTitle}
    Like Count: ${video.likeCount}
    View Count: ${video.viewCount}
    Favorite Count: ${video.favoriteCount}
    Comment Count: ${video.commentCount}
    Post Description: ${video.postDescription || 'N/A'}
    Post Title: ${video.postTitle}
    `).join('\n\n')}
`;

            console.log("Truncated prompt size:" + prompt.length);

            if (prompt.length > 6144) {
                console.log("PROMPT STILL TOO LONG. Further truncation needed.");

                prompt = `
VIDEOS: 
${videos.map(video => `
    Video ID: ${video.videoId}
    Title: ${video.title}
    Description: ${truncateContent(video.description, maxDescriptionLength / 4)}
    Transcript: ${truncateContent(video.transcript, maxTranscriptLength / 4)}
    Video Importance Score: ${video.videoImportanceScore}
    Channel Title: ${video.channelTitle}
    Like Count: ${video.likeCount}
    View Count: ${video.viewCount}
    Favorite Count: ${video.favoriteCount}
    Comment Count: ${video.commentCount}
    Post Description: ${video.postDescription || 'N/A'}
    Post Title: ${video.postTitle}
    `).join('\n\n')}
`;


                console.log("Truncated2 prompt size:" + prompt.length);
            }

            fs.writeFileSync('./promptTop5.txt', prompt);
        }


        let model = "@cf/meta/llama-3-8b-instruct";
        const response = await run(model, {
            messages: [
                {
                    role: "system",
                    content: `You are a youtube video curator for bestofyoutube.com. Output JSON only. Do not provide explanations. 
                    Find the top 5 videos from the prompt data that you think are the most interesting 
                    Do not pick videos that relate to: programming, video games, music videos, movie trailer. Do not pick super old videos.
                     In your answer, return an array with 5 objects.  Each object should be: 
                     {videoId:'xxxxxxxx',what_rewrite:''/*lightly rephrase a new .what text, 1-2 sentences aka short paragraph*/,videoTitle_rewrite:''/*lightly rephrase a new short .videoTitle*/}. No explanations.`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        //if (response)
        //    console.log({ response });
        //console.log("RESULT: " + typeof response.result.response);

        fs.writeFileSync('./responseTop5.txt', response.result.response);

        if (response.errors) {
            console.log("ERRORS", response.errors);
        }

        /*
        example response:
        response: "[\n    {\"videoId\": \"IRviDz_U8SI\", \"what_rewrite\": \"Explore the Fall of the Soviet Union\", \"videoTitle_rewrite\": \"The Beginning of the End\"},\n    {\"videoId\": \"vklMjfA4orc\", \"what_rewrite\": \"Empowering Impossible Challenges\", \"videoTitle_rewrite\": \"Zach's Amazing Feat\"},\n    {\"videoId\": \"rn9dkV4sVYQ\", \"what_rewrite\": \"Mind-Blowing Microscopic Journey\", \"videoTitle_rewrite\": \"Shrinking Down to Atoms\"},\n    {\"videoId\": \"R4J1seTHAMU\", \"what_rewrite\": \"Celebrating LA's Iconic Eating Spot\", \"videoTitle_rewrite\": \"Anthony Bourdain's Favourite Restaurant\"},\n    {\"videoId\": \"u7ux9DaOaFc\", \"what_rewrite\": \"Thrilling In-Flight Saga\", \"videoTitle_rewrite\": \"Virgin Australia's Engine Flameout\"}\n]",
  */
        let result = [];
        try {
            result = JSON.parse(response.result.response);
        } catch (e) {
            console.log("ERROR: response.result.response is not valid JSON", e);

        }

        //console.log({ result });

        if (typeof result !== 'object') {
            console.log("ERROR: result is not an object");
            return reject("ERROR: result is not an object");
        } else if (result.length !== 5) {
            console.log("ERROR: result is not an array of 5 objects");
            return reject("ERROR: result is not an array of 5 objects");

        } else if (!result[0] || (!result[0].videoTitle_rewrite && !result[0].videoTitle)) {
            console.log("ERROR: result[0] is not an object with a videoTitle_rewrite property");
            return reject("ERROR: result[0] is not an object with a videoTitle_rewrite property");
        }

        if (!result[0].videoTitle_rewrite && result[0].videoTitle) {
            //rename 
            result[0].videoTitle_rewrite = result[0].videoTitle;
            delete result[0].videoTitle;
        }
        if (!result[0].what_rewrite && result[0].what) {
            //rename 
            result[0].what_rewrite = result[0].what;
            delete result[0].what;



        }


        //date but in YYYY-MM-DD foramt
        const dateStr = moment(date).format('YYYY-MM-DD');
        //date in mmm D format
        const dateStr2 = moment(date).format('MMM D');


        const top5videos = result.map(video => {
            const videoId = video.videoId;
            //Get the original video object, and merge this new object into it (so adding  what_rewrite and videoTitle_rewrite)
            const originalVideo = videos.find(video => video.videoId === videoId);
            return {
                ...originalVideo,
                ...video,
                dateStr,
                dateStr2,
                updated: Date.now()
            }






        })



        fs.writeFileSync('./top5videos.json', JSON.stringify(top5videos, null, 2));


        storage.saveTop5Videos(top5videos);


        return resolve(top5videos);
    });
};

module.exports = main;
