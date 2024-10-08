const fs = require('fs');
const snoowrap = require('snoowrap');

//const extractPosts = require("./extractPostsFromRedditHTML.js")
const getYCombinatorPosts = require('./getYCombinatorPosts');
const extractCommentsFromHTML = require('./extractCommentsFromReddit');
const getYoutubeTranscriptAndInfo = require('./getYoutubeTranscriptAndInfo');

console.log("Starting");

const storage = require('./storage.js');
const { get } = require('underscore');


const getYouTubeInfo = async (vid) => {
    const id = vid.videoId.trim();
    //NOTE: this is a server key managed in https://console.cloud.google.com/apis/credentials/key/0?project=secret-descent-94518
    const youtubeApiURL = `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${process.env.YOUTUBE_KEY}&part=snippet,contentDetails,statistics,status`;
    //console.log({ youtubeApiURL })

    try {

        let response = await fetch(youtubeApiURL);


        const data = await response.json();
        //console.log(JSON.stringify(data, null, 2))

        if (!data || !data.items || !data.items.length === 0) {
            console.log("No data from youtube, status code:", response.status, response.statusText);

            return null;
        }

        const gdata = data.items[0];

        console.log(gdata.snippet)

        const item = {
            title: gdata.snippet.title,
            tags: [],
        };

        let maxres = null;
        let high = null;
        let medium = null;

        let width = null;
        let height = null;

        if (gdata && gdata.snippet && gdata.snippet.thumbnails) {
            if (gdata.snippet.thumbnails.maxres) {
                maxres = gdata.snippet.thumbnails.maxres;
            } else if (gdata.snippet.thumbnails.high) {
                high = gdata.snippet.thumbnails.high;
            } else if (gdata.snippet.thumbnails.medium) {
                medium = gdata.snippet.thumbnails.medium;
            }
        }

        if (maxres && maxres.width && maxres.height) {
            width = maxres.width;
            height = maxres.height;
        } else if (high && high.width && high.height) {
            width = high.width;
            height = high.height;
        } else if (medium && medium.width && medium.width) {
            width = medium.width;
            height = medium.height;
        }



        let thumbnail = maxres ? maxres.url : (high ? high.url : (medium ? medium.url : "http://img.youtube.com/vi/${id}/maxresdefault.jpg"))
        let doesExistThumbnail = _checkRemoteFile(thumbnail)
        item.thumbnail = doesExistThumbnail ? thumbnail : `http://img.youtube.com/vi/${id}/0.jpg`;

        item.duration = _covtime(gdata.contentDetails.duration);
        item.embed = gdata.status.embeddable;
        item.id = gdata.id;
        if (gdata.snippet && gdata.snippet.description)
            item.description = gdata.snippet.description;
        if (gdata.snippet && gdata.snippet.tags)
            item.tags = gdata.snippet.tags;
        if (gdata.snippet && gdata.snippet.channelTitle)
            item.channelTitle = gdata.snippet.channelTitle;
        if (gdata.statistics && gdata.statistics.viewCount)
            item.views = gdata.statistics.viewCount;
        if (width)
            item.width = width;
        if (height)
            item.height = height;

        item.gDataAll = gdata;

        item.source = vid.source //Where we scraped the data from

        return item;
    } catch (error) {
        console.error(error.message);
        return null;
    }
};

const _checkRemoteFile = async (url) => {
    return new Promise(async (resolve, reject) => {



        try {
            const response = await fetch(url);
            let fileSize = 0;
            if (response.headers.has('content-length')) {
                fileSize = parseInt(response.headers.get('content-length'), 10);
            }
            console.log("URL", { url, fileSize })
            return resolve(response.statusCode === 200 && filesize > 1500)
        } catch (error) {
            return resolve(false);
        }

    });
};

const _covtime = (youtubeTime) => {
    const parts = youtubeTime.match(/\d+/g) || [];

    if (parts.length === 1) {
        parts.unshift("0", "0");
    } else if (parts.length === 2) {
        parts.unshift("0");
    }

    const secInit = parseInt(parts[2], 10);
    const seconds = secInit % 60;
    const secondsOverflow = Math.floor(secInit / 60);

    const minInit = parseInt(parts[1], 10) + secondsOverflow;
    const minutes = minInit % 60;
    const minutesOverflow = Math.floor(minInit / 60);

    const hours = parseInt(parts[0], 10) + minutesOverflow;

    return hours * 60 * 60 + minutes * 60 + seconds;
};


let urls = [
    "https://old.reddit.com/r/videos/",
    "https://old.reddit.com/r/Documentaries/",
    "https://old.reddit.com/r/interestingasfuck/",
    //"https://news.ycombinator.com/",
    "https://old.reddit.com/r/todayilearned/",
    "https://old.reddit.com/r/funny/",
    "https://old.reddit.com/r/educationalvideos/",
    "https://old.reddit.com/r/nextfuckinglevel/",
    "https://old.reddit.com/r/oddlysatisfying/",



    // "https://www.reddit.com/r/youtubehaiku/",
    /*
    "https://old.reddit.com/r/Documentaries/",
    "https://old.reddit.com/r/videos/",
    "https://old.reddit.com/r/interestingasfuck/",
    "https://old.reddit.com/r/DeepIntoYouTube/",
    "https://old.reddit.com/",
    "https://old.reddit.com/r/TikTokCringe/",
    "https://old.reddit.com/r/TikTok/",*/
];
//urls = ["https://www.youtube.com/@CaptainDisillusion/videos?view=0&sort=dd&shelf_id=0",];

let videos = [];
let htmls = [];

const regularFetch = async (url) => {
    return new Promise(async (resolve, reject) => {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            }
        });
        const html = await response.text()
        const responseCode = response.status;
        resolve({ html, responseCode });
    });
}

const getYoutubeVideoIdFromURL = (url) => {
    const regex = /\/\/(?:www\.|m\.)?youtu(?:be\.com\/(?:watch\?v=|embed\/|v\/)|\.be\/)([\w\-_]*)(&(amp;)?[\w\?‌​=]*)?/g;
    let matches = url.match(regex) || [];

    //also extract from "url":"/watch?v=28S47EE_opA"
    const regex2 = /url":"\/watch\?v=([\w\?‌​=]*)/g;
    let matches2 = url.match(regex2) || [];

    //also match https://i.ytimg.com/vi/28S47EE_opA/hqdefault.jpg
    const regex3 = /https:\/\/i.ytimg.com\/vi\/([\w\?‌​=]*)\/hqdefault.jpg/g;
    let matches3 = url.match(regex3) || [];

    //combine matches and matches2 and matches 3 together
    matches = matches.concat(matches2);
    matches = matches.concat(matches3);

    //remove duplicates
    matches = matches.filter((v, i, a) => a.findIndex(t => (t === v)) === i)

    //filter out the onces less than 11 characters
    matches = matches.filter(m => m.length > 11)

    console.log(matches)

    if (matches.length > 0) {
        let youtube_url = matches[0];
        let videoId = youtube_url.replace(/.*\//, '').replace("watch?v=", "")
        //remove & or ? and anything after it
        videoId = videoId.replace(/[&\?].*/, '')
        return videoId;

    } else {
        return false;
    }


}

function trimLongStrings(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].slice(0, 500);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = trimLongStrings(obj[key]);
        }
    }
    return obj;
}

function getRedditPosts(url) {
    return new Promise(async (resolve, reject) => {
        //Remove last / from url.  Add .json to the end
        let jsonUrl = url.replace(/\/$/, "") + ".json";
        //console.log({ jsonUrl })

        let jsonData = await regularFetch(jsonUrl);
        try {
            jsonData = JSON.parse(jsonData.html);

        } catch (e) {
            console.log("Error parsing json", e);
            //console.log("jsonData", jsonData)
        }
        resolve(jsonData);
    })

}


const reddit = new snoowrap({

    userAgent: 'videyo by /u/alexbest',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD
});

function getRedditPostsFromAPI(url) {
    //url example: "https://old.reddit.com/r/videos/"
    //url example: "https://reddit.com/r/videos/"
    //url example: "https://www.reddit.com/r/videos/"
    return new Promise(async (resolve, reject) => {
        //get whatever after /r/
        let subreddit = url.replace(/.*\/r\//, "").replace(/\/$/, "");

        console.log({ subreddit })

        let data = [];


        try {
            let posts = await reddit.getSubreddit(subreddit)
                .getTop({ time: 'day', limit: 10 });

            posts = posts.filter(post => post.ups > 100);
            posts = posts.filter(post => post.num_comments > 10);
            posts = posts.filter(post => post.upvote_ratio > 0.6);
            posts = posts.filter(post => !post.over_18);
            

            posts.forEach(post => {
                //console.log(post)
                //console.log the keys
                for (let key in post) {
                    // console.log(key)
                }



            })

            fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2))



            data = posts.map(post => {
                return {
                    commentsLink: `https://old.reddit.com${post.permalink}`,
                    url: post.url,
                    title: post.title,
                    //author: post.author,
                    subreddit: subreddit,
                    score: post.score,
                    description: post.selftext || post.selftext_html,
                    id: post.id || null
                }

            })

            posts.forEach(post => {
                console.log(`Title: ${post.title}`);
                console.log(`URL: ${post.url}`);
                console.log('---');
            });
        } catch (error) {
            console.error("Error fetching posts:", error);
        }

        return resolve(data);

    })

}

async function getRedditTopComments(postId) {
    return new Promise(async (resolve, reject) => {

        try {

            const comments = await reddit.getSubmission(postId).expandReplies({ limit: 5, depth: 1 })

            fs.writeFileSync("comments.json", JSON.stringify(comments, null, 2))


            //return resolve(JSON.stringify(comments, null, 2))

            comments.forEach(comment => {
                console.log(`Author: ${comment.author.name}`);
                console.log(`Comment: ${comment.body}`);
                console.log('---');
            });

            let social_data = "";
            social_data += comments
                /*.map(comment => {
                    return {
                        author: comment.author,
                        body: comment.body,
                        score: comment.score,
                        replies: comment.replies.map(reply => {
                            return {
                                author: reply.author,
                                body: reply.body,
                            }
    
                        })
                    }
                })*/
                .map(comment => {
                    //return in text format
                    return `
                ${comment.author}: ${comment.body}
                ${comment.replies.map(reply => {
                        return `
                    ${reply.author}: ${reply.body}
                    `

                    })}`
                }).join("\n\n")


            resolve(social_data);

        }



        catch (error) {
            console.error('Error fetching comments:', JSON.stringify(error, null, 2));
            return resolve("");
        }

    })
}


const processUrl = async (url, index) => {
    console.log(`Doing ${url}.`);
    try {

        const useProxy = false;
        let response = false;
        let html = "";
        let responseCode = 0;
        let posts = [];


        let isYCombinator = url.indexOf("ycombinator") > -1;

        if (isYCombinator) {

            posts = await getYCombinatorPosts(url);
        } else {


            //let jsonData = await getRedditPosts(url);
            let jsonData = await getRedditPostsFromAPI(url);
            //console.log({ jsonData })


            if (typeof jsonData === 'object' && jsonData !== null) {

                let children = jsonData.data && jsonData.data.children ? jsonData.data.children : jsonData;

                for (let child of children) {
                    let post = child.data ? child.data : child;
                    console.log({ post })
                    let commentsLink = post.commentsLink || `https://old.reddit.com${post.permalink}`;
                    let url = post.url;
                    let title = post.title;
                    let author = post.author;
                    let subreddit = post.subreddit;
                    let score = post.score;
                    let description = post.description || post.selftext;
                    let id = post.id || null;

                    console.log({ commentsLink, url, title, author, subreddit, score })

                    let newPost = {
                        commentsLink,
                        url,
                        title,
                        description,
                        id
                    }
                    console.log({ newPost })
                    posts.push(newPost)

                }

            }



        }

        // { html, responseCode } = await regularFetch(url);

        // // Remove unneeded tags
        // html = html.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');
        // html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // html = html.replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '');
        // html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        // // Modified to handle both self-closing and non-self-closing <img> tags
        // html = html.replace(/<img\b[^>]*>/gi, '');

        // posts  = await extractPosts(html);



        console.log({ posts })

        //for each post
        for (let post of posts) {
            //get the youtube video id
            if (!post.url)
                continue;

            let videoId = getYoutubeVideoIdFromURL(post.url);

            if (!videoId)
                continue;


            let doesExistVideoPrompt = await storage.checkIfPromptExists(videoId);
            let doesExistVideoDescription = await storage.checkIfVideoExists(videoId);


            if (doesExistVideoPrompt || doesExistVideoDescription) {
                console.log("Video prompt already exists for", videoId);
                continue;
            }


            console.log({ videoId, post })

            //Get reddit post page for comments

            let hasPostId = post.id && post.id.length > 0;
            console.log(post, { hasPostId })


            let social_data = "";

            if (hasPostId) {
                //Get from reddit API
                social_data = await getRedditTopComments(post.id);




            } else {
                let response = await fetch(post.commentsLink);
                let post_html = await response.text();

                const post_contents = isYCombinator ? post_html.toString() : await extractCommentsFromHTML(post_html);
                social_data = post_contents;

            }


            console.log({ social_data })
            //process.exit();


            const videoInfo = await getYoutubeTranscriptAndInfo(videoId);

            const youtubeInfo = await getYouTubeInfo({ videoId, source: url });


            const prompt = `
    Consider this input data about a youtuber's video posted to social media:

    YOUTUBE VIDEO ID: ${videoId}
    
    POST DATA:
    ${JSON.stringify(trimLongStrings(post))}

    POST AND COMMENTS DATA:
    ${JSON.stringify(trimLongStrings(social_data))}

    YOUTUBE VIDEO DATA:
    ${JSON.stringify(trimLongStrings(videoInfo))}

    YOUTUBE INFO:
    ${JSON.stringify(trimLongStrings(youtubeInfo))}


    Give me a summary of the video in this format below. Be very brief, straight to the point.  Short sentenses.  Talk like a friend would. Be opnionated. Write like a financial analyst would write a company report. Your answer should only be a code block with a javascript object inside. No explanations.


    {
        "videoTitle": "",//Max 5 words. Editorialize the title of the video. Make it descriptive and enticing, but not clickbait.
        "what": "",//Max 25 words. What is the video about? write 1 paragraph. The first sentence should be the thesis of the video, or what it's all about; you should be able to get what this video is from just that - sometimes the "why" is needed upfront if it's not obvious to the user if they would want to watch this video or not, sometimes not.  Don't start with "In this video, " or something like that, just get into it.
        "youtubeVideoId": "",//The ID of the video. This is the part of the URL after "v="
        "thumbnailUrl": "",//the largest known valiud thumbnail (use the YOUTUBE INFO section)
        "thumbnailWidth": "",//the width of the thumbnail (use the YOUTUBE INFO section)
        "thumbnailHeight": "",//the height of the thumbnail (use the YOUTUBE INFO section)
        "runtime": "",//the length of the video in (h:)mm:ss (use the YOUTUBE INFO section). No leading 0.
        "videoImportanceScore": 0.5,//This is a number between 0 and 1 that represents how worthwhile the video is to watch for a general audience. 0 means it's not important at all, 1 means it's very important. The higher the number, the more satisfied an average internet user will be to have watched the video. This is a number that you come up with.  Override rule: if it's only a music video, or a movie trailer, or video gameplay footage, or video game trailer/announcement, set this to 0.1.
        "videoInterestingScore": 0.5,//Rate how intersting the video is to a 30 year old female
        "source": "",//URL where the video was found. Use comments link if provided.
        "timeAdded":"${new Date().toISOString()}",//Keep this date as is.
        "tags": [""],//Array of strings. About 5 tags about the topic or category of the video.  Most important tags. Examples: music, gaming, funny, tutorial, meme, travel, netflix, ...
        "format": [""],//Array of strings. Usually 1 string, but could have 2. Examples: vlog, documentary, skit, movie clip, tutorial, review, gameplay, interview, music video, meme, amateur video, home video, animation, behind the scenes, reaction video, live stream, unboxing, explainer video, commentary, product demo, challenge video, other (specify) 
    }


    Here is an example:
       {
        "videoTitle": "A Succulent Chinese Meal",
        "what": "Bizarre altercation between a belligerent man and law enforcement over his meal. The Australian vehemently protests his arrest, shouting about his 'succulent Chinese meal'.",
        "youtubeVideoId": "XebF2cgmFmU",
        "thumbnailUrl": "https://i.ytimg.com/vi/XebF2cgmFmU/hqdefault.jpg",
        "thumbnailWidth": 480,
        "thumbnailHeight": 360,
        "runtime": "1:09",
        "videoImportanceScore": 0.7,
        "source": "https://old.reddit.com/r/videos/comments/1cx35yj/democracy_manifest/",
        "timeAdded": "2024-05-21T17:09:07.226Z",
        "tags": ["funny", "arrest", "meme", "quotable", "cult classic"],
        "format": ["amateur video" ]
       }


    AGAIN, please only output a javascript object (in the format as above) in a code block, nothing else.
    Don't start paragraphs with "This video ..." or "In this video.." etc, just get right into it. MAKE SURE YOUR OUTPUT IS VALID JSON.  Right before outputting, check the json for validity, and correct any invalid json (comma problems, quotation mark problems, terminate the json string correctly, etc)
`

            let payload = {
                videoId,
                prompt,
                videoInfo,
                youtubeInfo,
                url,
                post,
                social_data
            }

            //save to database
            await storage.savePrompt(payload);


        }


        return;
        process.exit();


        htmls.push(responseCode)
        htmls.push(html)


        console.log(`Found ${matches.length} matches`);

        Array.from(matches).map(match => {
            console.log("match")
            let videoId = match.replace(/.*\//, '').replace("watch?v=", "")
            //remove & or ? and anything after it
            videoId = videoId.replace(/[&\?].*/, '')
            videos.push({
                videoId: videoId,
                url: match,
                source: url
            })
        })

        console.log({ videos })

    } catch (error) {
        console.error("Error: !", error);
    }
};

const main = async () => {
    return new Promise(async (resolve, reject) => {
        let newVideosCount = 0;

        let results = [];

        for (const url of urls) {
            let index = urls.indexOf(url);
            let result = await processUrl(url, index);
            results.push(result);
        }

        console.log(videos);

        return resolve(results)
    })
};

module.exports = main;

