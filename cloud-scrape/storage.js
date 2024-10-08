//Write a google cloud datastore api in node.js.  There are 2 tables: prompts, and videos.
//We first need to save prompts.
//Then an AI LLM will process it and save it to the videos tables.
//We also need a function to check if a videoId already exists in either the prompts table or the videos table.

const _ = require("underscore")
const moment = require("moment-timezone")
const { Datastore } = require('@google-cloud/datastore')
const { and, PropertyFilter } = require('@google-cloud/datastore');

const TABLE_PROMPTS = "prompts"
const TABLE_VIDEOS = "videos"
const TABLE_TOP_VIDEOS = "videos_top"

// Creates a client
const datastore = new Datastore({
    "projectId": "secret-descent-94518"
});

let storage = {}

storage._saveToDb = function (table, key = false, data) { //save to Google DataStore, with retry built-in
    //console.log("saveToDb", table, key)

    if (!key)
        key = data.videoId

    data.time = moment().tz("America/Toronto").format("YYYY-MM-DD HH:mm:ss")
    data.timestamp = moment().unix()

    data.agent = process.env.COMPUTERNAME || process.env.HOSTNAME || "server"


    if (!data.videoId)
        data.videoId = key

    let payload = _.map(data, function (val, key) {
        if (val !== undefined)
            return {
                name: key,
                value: val,
                excludeFromIndexes: !(_.contains(["time", "created", "updated", "timeAdded", "dateStr"], key))
            }
    })

    //console.log({ data, payload })

    return new Promise((resolve, reject) => {

        //If !key, then have a key auto-generated
        var ds_key = key ? datastore.key([table, key]) : datastore.key(table)

        datastore.save({
            key: ds_key,
            data: payload
        }, function (err) {
            if (err) {
                console.log("Error saving to DS, retry", err);

                datastore.save({
                    key: ds_key,
                    data: payload
                }, function (err) {
                    if (err) {
                        console.log("Error saving to DS again, wait and try 3rd time", err);

                        setTimeout(function () {
                            datastore.save({
                                key: ds_key,
                                data: payload
                            }, function (err) {
                                if (err) {
                                    console.log("Error saving to DS, was final attempt", err);
                                    resolve(false)
                                } else {
                                    console.log("Done saving to DS.3")
                                    resolve(false)
                                }
                            });
                        }, 3e3)

                    } else {
                        console.log("Done saving to DS.2")
                        resolve(false)
                    }
                });
            } else {
                console.log("Done saving to DS.1")
                resolve(false)
            }
        });

    })
}



storage._checkIfKeyExists = function (table, key) {
    //console.log({ table, key })
    return new Promise(async function (resolve) {
        if (!key)
            return false;
        const datastoreKey = datastore.key([table, key.toString()])

        var query = datastore.createQuery(table) //Do a key-only call first, which is free
            .filter('__key__', '=', datastoreKey)
            .select('__key__')
            .limit(1);

        datastore.runQuery(query)
            .then(function (results) {
                if (_.isObject(results[0][0])) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            }
            )
            .catch(function (e) {
                console.log({ e })
                resolve(true)  //If there's an error, guess
            })
    })


}



storage._getFromDb = function (table, key) {
    return new Promise(async (resolve, reject) => {
        const ds_key = datastore.key([table, key]);
        try {
            const [entity] = await datastore.get(ds_key);
            resolve(entity);
        } catch (err) {
            reject(err);
        }
    });
};


storage.checkIfPromptExists = async function (videoId) {
    return storage._checkIfKeyExists(TABLE_PROMPTS, videoId);
};

storage.checkIfVideoExists = async function (videoId) {
    return storage._checkIfKeyExists(TABLE_VIDEOS, videoId);
};

storage.savePrompt = async function (prompt) {
    // Assuming 'prompt' object has a 'videoId' property
    return storage._saveToDb(TABLE_PROMPTS, prompt.videoId, prompt);
};

storage.saveVideo = async function (video) {
    // Assuming 'video' object has a 'videoId' property
    return storage._saveToDb(TABLE_VIDEOS, video.videoId, video);
};

storage.getPrompt = function (videoId) {
    return storage._getFromDb(TABLE_PROMPTS, videoId);
};

storage.getVideo = function (videoId) {
    return storage._getFromDb(TABLE_VIDEOS, videoId);
};

storage.getLatestPrompts = function (limit = 10) {
    //sorted by "time" column desc (which is an index column)
    return new Promise(async (resolve, reject) => {
        const query = datastore.createQuery(TABLE_PROMPTS)
            .order('time', {
                descending: true
            })
            .limit(limit);
        try {
            const [entities] = await datastore.runQuery(query);
            resolve(entities);
        } catch (err) {
            reject(err);

        }
    })

}


storage.deletePrompt = function (videoId) {
    return new Promise(async (resolve, reject) => {
        const ds_key = datastore.key([TABLE_PROMPTS, videoId]);
        datastore.delete(ds_key, function (err) {
            if (err) {
                reject(err);

            } else {
                console.log(`Deleted prompt ${videoId}`)
                resolve(true);
            }

        })


    })

}

const deepGet = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

storage.getVideosInDateRange = function (start, end) {
    return new Promise(async (resolve, reject) => {
        console.log({ start, end }, start.toISOString())

        //Todo: start and end need to be a string like this: 2024-06-17T04:00:00.000Z. It will be passed as a javascript date object.
        //So we need to convert it to a string.
        //start = start.toISOString()


        const query = datastore
            .createQuery(TABLE_VIDEOS)
            .filter(
                and([
                    new PropertyFilter('timeAdded', '>=', start.toISOString()),
                    new PropertyFilter('timeAdded', '<', end.toISOString()),
                ])
            )
            .order('timeAdded', { descending: true })
            .limit(50);






        try {
            const [entities] = await datastore.runQuery(query);

            //This is a sample video object:
            /*
            {
          agent: "server",
          social_data: "",
          videoImportanceScore: 0.5,
          videoInfo: {
            transcript: "today I&amp;#39;m going to show you how I made\nthis 1 to 26 scale diarama of an\nincident involving Fabio lenon a roller\ncoaster and a Canadian ghost and if you\nstick around to the end I&amp;#39;ll show you\nhow it can be\nyours I began by sculpting a one toone\nscale portrait of Fabio in W clay using\na cutout of his profile 
    to set the\nproportions of his\nface you may have noticed at the start\nthey said Canadian ghost rather than\nCanada ghost according to the bird&amp;#39;s\nWikipedia page calling it ",
            description: "BECOME A PATRON  https://www.patreon.com/bobbyfingers\n\nBUY MY BOOK https://linktr.ee/bobbyfingers\n\nADAMS VIDEO!!!  https://www.youtube.com/watch?v=xigcQMUbbZ0\n\nSLOW MO GUYS VIDEO!!! https://www.youtube.com/watch?v=w9i9rwg1L_A\n\nBUY ME A COFFEE. https://ko-fi.com/bobbyfingers\n\nVISIT MY WISHLIST https://mywishlist.online/w/xepzjg/bo...\n\nProduced by Rob Sutton and Bobby Fingers.\n\n Follow CLAIRE BYRNES https://www.instagram.com/c_byrnesfit/?hl=en \n\nThanks to the good people of ODYSSEY STUDIOS https:/",
            title: "Fabio and the Goose",
          },
          format: [ "vlog" ],
          runtime: "0:25",
          videoId: "2RIEPKEhE2s",
          source: "https://old.reddit.com/r/videos/comments/1dhitze/guy_does_a_diorama_of_fabios_roller_coaster/",
          videoTitle: "Fabio's Scale Model Disaster",
          thumbnailWidth: 1280,
          url: "https://old.reddit.com/r/videos/",
          tags: [ "model", "DIY", "Fabio", "roller coaster", "amusement park" ],
          timeAdded: "2024-06-17T02:10:42.076Z",
          what: "YouTuber Bobby Fingers creates a 1:26 scale diorama of Fabio's roller coaster accident, featuring a Canadian ghost.",
          youtubeInfo: {
            thumbnail: "https://i.ytimg.com/vi/2RIEPKEhE2s/maxresdefault.jpg",
            gDataAll: {
              snippet: {
                publishedAt: "2024-05-15T14:00:02Z",
                localized: {
                  description: "BECOME A PATRON  https://www.patreon.com/bobbyfingers\n\nBUY MY BOOK https://linktr.ee/bobbyfingers\n\nADAMS VIDEO!!!  https://www.youtube.com/watch?v=xigcQMUbbZ0\n\nSLOW MO GUYS VIDEO!!! https://www.youtube.com/watch?v=w9i9rwg1L_A\n\nBUY ME A COFFEE. https://ko-fi.com/bobbyfingers\n\nVISIT MY WISHLIST https://mywishlist.online/w/xepzjg/bo...\n\nProduced by Rob Sutton and Bobby Fingers.\n\n Follow CLAIRE BYRNES https://www.instagram.com/c_byrnesfit/?hl=en \n\nThanks to the good people of ODYSSEY STUDIOS https:/",
                  title: "Fabio and the Goose",
                },
                description: "BECOME A PATRON  https://www.patreon.com/bobbyfingers\n\nBUY MY BOOK https://linktr.ee/bobbyfingers\n\nADAMS VIDEO!!!  https://www.youtube.com/watch?v=xigcQMUbbZ0\n\nSLOW MO GUYS VIDEO!!! https://www.youtube.com/watch?v=w9i9rwg1L_A\n\nBUY ME A COFFEE. https://ko-fi.com/bobbyfingers\n\nVISIT MY WISHLIST https://mywishlist.online/w/xepzjg/bo...\n\nProduced by Rob Sutton and Bobby Fingers.\n\n Follow CLAIRE BYRNES https://www.instagram.com/c_byrnesfit/?hl=en \n\nThanks to the good people of ODYSSEY STUDIOS https:/",
                title: "Fabio and the Goose",
                thumbnails: {
                  standard: {
                    width: 640,
                    url: "https://i.ytimg.com/vi/2RIEPKEhE2s/sddefault.jpg",
                    height: 480,
                  },
                  default: {
                    width: 120,
                    url: "https://i.ytimg.com/vi/2RIEPKEhE2s/default.jpg",
                    height: 90,
                  },
                  high: {
                    width: 480,
                    url: "https://i.ytimg.com/vi/2RIEPKEhE2s/hqdefault.jpg",
                    height: 360,
                  },
                  maxres: {
                    width: 1280,
                    url: "https://i.ytimg.com/vi/2RIEPKEhE2s/maxresdefault.jpg",
                    height: 720,
                  },
                  medium: {
                    width: 320,
                    url: "https://i.ytimg.com/vi/2RIEPKEhE2s/mqdefault.jpg",
                    height: 180,
                  },
                },
                channelId: "UCXKCiTquPMavBqgXgrM9mBg",
                categoryId: "26",
                channelTitle: "Bobby Fingers",
                liveBroadcastContent: "none",
              },
              kind: "youtube#video",
              etag: "nfBtz8FhKbDIC3gnU7Wj-7HMJ_Y",
              id: "2RIEPKEhE2s",
              contentDetails: {
                duration: "PT25M",
                licensedContent: true,
                caption: "false",
                definition: "hd",
                contentRating: {},
                projection: "rectangular",
                dimension: "2d",
              },
              status: {
                license: "youtube",
                privacyStatus: "public",
                uploadStatus: "processed",
                publicStatsViewable: true,
                embeddable: true,
                madeForKids: false,
              },
              statistics: {
                likeCount: "32322",
                viewCount: "447543",
                favoriteCount: "0",
                commentCount: "2028",
              },
            },
            description: "BECOME A PATRON  https://www.patreon.com/bobbyfingers\n\nBUY MY BOOK https://linktr.ee/bobbyfingers\n\nADAMS VIDEO!!!  https://www.youtube.com/watch?v=xigcQMUbbZ0\n\nSLOW MO GUYS VIDEO!!! https://www.youtube.com/watch?v=w9i9rwg1L_A\n\nBUY ME A COFFEE. https://ko-fi.com/bobbyfingers\n\nVISIT MY WISHLIST https://mywishlist.online/w/xepzjg/bo...\n\nProduced by Rob Sutton and Bobby Fingers.\n\n Follow CLAIRE BYRNES https://www.instagram.com/c_byrnesfit/?hl=en \n\nThanks to the good people of ODYSSEY STUDIOS https:/",
            source: "https://old.reddit.com/r/videos/",
            title: "Fabio and the Goose",
            tags: [],
            duration: 25,
            width: 1280,
            embed: true,
            id: "2RIEPKEhE2s",
            views: "447543",
            channelTitle: "Bobby Fingers",
            height: 720,
          },
          post: {
            description: "For anyone who isn’t familiar, this guys videos are really entertaining. ",
            id: "1dhitze",
            title: "Guy does a diorama of  Fabio’s roller coaster accident ",
            commentsLink: "https://old.reddit.com/r/videos/comments/1dhitze/guy_does_a_diorama_of_fabios_roller_coaster/",
            url: "https://youtu.be/2RIEPKEhE2s?si=Qct22ouRkxWhnzTP",
          },
          youtubeVideoId: "2RIEPKEhE2s",
          time: "2024-06-16 22:10:42",
          thumbnailHeight: 720,
          thumbnailUrl: "https://i.ytimg.com/vi/2RIEPKEhE2s/maxresdefault.jpg",
          timestamp: 1718590242,
          [Symbol(KEY)]: Key {
            namespace: undefined,
            name: "2RIEPKEhE2s",
            kind: "videos",
            path: [Getter],
            serialized: [Getter],
          },
          */

            //TODO Loop through each one, and return on object for each with this data:
            //videoId (same as youtubeVideoId), title, videoTitle, description, transcript videoImportanceStore, what, channelTitle, likeCount, viewCount, favoriteCount, commentCount, post.description (reddit post description), post.title (reddit post title)

            const videos = entities.map((entity) => {
                const video = {
                    videoId: deepGet(entity, 'youtubeVideoId'),
                    title: deepGet(entity, 'youtubeInfo.title'),
                    videoTitle: deepGet(entity, 'videoTitle'),
                    description: deepGet(entity, 'youtubeInfo.description'),
                    transcript: deepGet(entity, 'videoInfo.transcript'),
                    videoImportanceScore: deepGet(entity, 'videoImportanceScore'),
                    what: deepGet(entity, 'what'),
                    channelTitle: deepGet(entity, 'youtubeInfo.channelTitle'),
                    likeCount: deepGet(entity, 'youtubeInfo.gDataAll.statistics.likeCount'),
                    viewCount: deepGet(entity, 'youtubeInfo.gDataAll.statistics.viewCount'),
                    favoriteCount: deepGet(entity, 'youtubeInfo.gDataAll.statistics.favoriteCount'),
                    commentCount: deepGet(entity, 'youtubeInfo.gDataAll.statistics.commentCount'),
                    postDescription: deepGet(entity, 'post.description'),
                    postTitle: deepGet(entity, 'post.title'),
                };

                return video;
            });

            resolve(videos);
        } catch (err) {
            reject(err);
        }
    });
};

storage.saveTop5Videos = function (videos) {
    /* Sample videos arr:
    [
  {
    "videoId": "IRviDz_U8SI",
    "title": "The Beginning of the End: Soviet Union's Fall",
    "videoTitle": "Soviet Union's Deadly Descent",
    "description": "In this first part of our series on the Fall of the Soviet Union, we explore the period from the death of Leonid Brezhnev in 1982 to the transformative year of 1990. Discover the key events, leadership changes, and policies that set the stage for the USSR's eventual collapse.\n\n#History #SovietUnion #ColdWar #Gorbachev #USSR #FallOfTheSovietUnion #HistoricalDocumentary",
    "transcript": "by the time Leonid brv passed away in\n1982 a staggering number of Soviet\ncitizens potentially reaching as high as\n60 million had suffered from starvation\noverwork or direct execution under the\nSoviet regime since\n[Music]\n1917 despite living standards falling\nsignificantly behind those of capitalist\nNations the leadership continued to\nallocate resources towards high-profile\nEndeavors such as space exploration\nand Military\nVentures while Bev&amp;#39;s Reign was not as\nruthless as that of Lenin or ",
    "videoImportanceScore": 0.8,
    "what": "The documentary examines the post-Brezhnev era of the Soviet Union, from 1982 to the 1991 coup attempt, revealing the staggering human cost of regime failures.",
    "channelTitle": "Report 383",
    "likeCount": "48",
    "viewCount": "784",
    "favoriteCount": "0",
    "commentCount": "5",
    "postTitle": "The Beginning of the End: Soviet Union's Fall (2024) - A documentary about the post Brezhnev era up until the 1991 coup attempt in Moscow, with original footage and archive news [00:42:27]\n",
    "what_rewrite": "This documentary provides a detailed look at the fall of the Soviet Union, exploring the events that led to its collapse.",
    "videoTitle_rewrite": "The Fall of the Soviet Union: A Documentary Series"
  },
  {
    "videoId": "rn9dkV4sVYQ",
    "title": "I shrink 10x every 21s until I'm an atom - The Micro Universe",
    "videoTitle": "Atom-Size Antics",
    "description": "Go to https://ground.news/epic to stay fully informed on what's happening in Space and the Universe we live in. Subscribe through my link for 40% off unlimited access this month.\n\nThis is a journey into the microscopic world, we usually think about the Universe as planets, space and galaxies but so much of the scale of the Universe is in the world of the small. I've always wanted to understand it better, so I've spent the last few months trying to make this Micro Universe not just accessible but",
    "transcript": "in this video I&amp;#39;m going to shrink down\n10 times every 21 seconds until I&amp;#39;m the\nsize of an atom I&amp;#39;m going to do this for\ntwo reasons firstly I can&amp;#39;t wait to see\nhow bizarre things get down there and\nsecondly we&amp;#39;re going to do it in a way\nusing a bit of a memory trick so that\nyou&amp;#39;ll always be able to remember the\nscale of the microscopic world without\nneeding to remember any numbers we&amp;#39;re\ngoing to make a map of our microscopic\nuniverse that w",
    "videoImportanceScore": 0.6,
    "what": "Shrinking down 10x every 21 seconds until becoming an atom, exploring the bizarre and using vfx and science",
    "channelTitle": "Epic Spaceman",
    "likeCount": "5535",
    "viewCount": "21624",
    "favoriteCount": "0",
    "commentCount": "603",
    "postTitle": "I shrink 10x every 21s until I'm an atom - The Micro Universe",
    "what_rewrite": "Join Epic Spaceman as he shrinks down to the size of an atom, exploring the fascinating world of the micro universe.",
    "videoTitle_rewrite": "Micro Universe: Shrink to the Size of an Atom"
  },
  {
    "videoId": "ImKY6TZEyrI",
    "title": "Mazzy Star - Fade Into You (Official Music Video)",
    "videoTitle": "Mazzy Star's Dreamy Rock Ballad",
    "description": "Official video for Mazzy Star's \"Fade Into You\" from the album So Tonight That I Might See. REMASTERED IN HD!\n\nWatch more Mazzy Star videos: https://www.youtube.com/playlist?list=OLAK5uy_nRYvtj0_SRhC7y5wpvJzmgbplA4t087wo\n\nMusic video by Mazzy Star performing Fade Into You. (P) 2005 Capitol Records, LLC\n#MazzyStar #FadeIntoYou #Remastered",
    "transcript": "(&amp;quot;FADE INTO YOU&amp;quot; BY MAZZY STAR)\n♪ I WANNA HOLD THE\nHAND INSIDE YOU ♪\n♪ I WANNA TAKE THE\nBREATH THAT&amp;#39;S TRUE ♪\n♪ I LOOK TO YOU\nAND I SEE NOTHING ♪\n♪ I LOOK TO YOU\nTO SEE THE TRUTH ♪\n♪ YOU LIVE YOUR LIFE,\nYOU GO IN SHADOWS ♪\n♪ YOU&amp;#39;LL COME APART\nAND YOU&amp;#39;LL GO BLACK ♪\n♪ SOME KIND OF NIGHT\nINTO YOUR DARKNESS ♪\n♪ COLORS YOUR EYES\nWITH WHAT&amp;#39;S NOT THERE ♪\n♪ FADE INTO YOU ♪\n♪ STRANGE YOU NEVER KNEW ♪\n♪ FADE INTO YOU ♪\n♪ I THINK IT&amp;#39;S STRANGE\nYOU NEV",
    "videoImportanceScore": 0.6,
    "what": "Mazzy Star's hauntingly beautiful music video for their song 'Fade Into You', featuring lyrics that explore longing and disconnection.",
    "channelTitle": "MazzyStarVEVO",
    "likeCount": "882715",
    "viewCount": "94093940",
    "favoriteCount": "0",
    "commentCount": "33899",
    "postTitle": "Mazzy Star - Fade Into You ",
    "what_rewrite": "Mazzy Star's iconic music video for 'Fade Into You' has captivated audiences for years.",
    "videoTitle_rewrite": "Mazzy Star - Fade Into You (Official Music Video)"
  },
  {
    "videoId": "vklMjfA4orc",
    "title": "How to do The impossible",
    "videoTitle": "Zach's Impossible Feat",
    "description": "YouTube shorts should be 90 seconds. \n￼",
    "transcript": "today seems like a great day to try\ndoing something impossible hi I&amp;#39;m Zach I\nhave cerebral palsy and the fine motor\nskills of a drunk Panda wearing oven\nmitts growing up as a kid with a\ndisability I saw a lot of therapists\nwhose job it was to assess which daily\nlife skills would be possible for me\nwalking no cooking microwave only uh\nbuttons yeah sure as long as they&amp;#39;re\nclown sized but one thing thing I could\nnever do was zippers no matter the\njacket I would tug and tug on those\n",
    "videoImportanceScore": 0.8,
    "what": "A man with cerebral palsy does daily life skills despite fine motor skills of a drunk panda.",
    "channelTitle": "Zach Anner",
    "likeCount": "434",
    "viewCount": "1559",
    "favoriteCount": "0",
    "commentCount": "48",
    "postTitle": "Zack Anner does the impossible",
    "what_rewrite": "Zach Anner, a talented creator with cerebral palsy, shares his inspiring story and demonstrates his incredible abilities.",
    "videoTitle_rewrite": "Doing the Impossible: A Story of Perseverance"
  },
  {
    "videoId": "Q1G_bda3o1o",
    "title": "This Experiment Undid Our Cities. How Do We Fix It?",
    "videoTitle": "Chicago's Urban Experiment",
    "description": "When we replaced our traditional pattern of development with the Suburban Experiment, there were some unforeseen consequences. Why did we do it, and how can we fix it?\n\nBecome a member: https://www.strongtowns.org/\n\nAbout us: We seek to replace America’s post-war pattern of development, the Suburban Experiment, with a pattern of development that is financially strong and resilient. We advocate for cities of all sizes to be safe, livable, and inviting. We elevate local government to be the highes",
    "transcript": "between 1840 and 1890 Chicago Grew From\na town of under 5,000 people to a\nbooming Metropolis of over 1 million 40\nyears later it would reach 3.3 million\npeople this period of Chicago&amp;#39;s history\nis home to some iconic building types\nbut the process that built these might\njust hold the key to how we can develop\nour places moving forward to not just\nmeet our needs but the needs of our kids\nand our kids\nkids\n[Music]\nwhat did people in Chicago know more\nthan a century ago that we don&amp;#39;t",
    "videoImportanceScore": 0.6,
    "what": "The rapid growth of Chicago between 1840 and 1890, fueled by Suburban Experiment, transformed it from a small town to a metropolis. But how can we fix cities that have been changed forever?",
    "channelTitle": "Strong Towns",
    "likeCount": "13732",
    "viewCount": "352610",
    "favoriteCount": "0",
    "commentCount": "1231",
    "postTitle": "This Experiment Undid Our Cities. How Do We Fix It?",
    "what_rewrite": "Strong Towns, a leading urban planning organization, examines the devastating impact of unmanaged growth on cities and proposes innovative solutions.",
    "videoTitle_rewrite": "Rebuilding Cities: A New Approach to Urban Development"
  }
]
  */

    return new Promise(async (resolve, reject) => {
        try {
            //For each item in videos, save to db table TABLE_TOP_VIDEOS
            for (let i = 0; i < videos.length; i++) {
                const video = videos[i];
                const key = video.dateStr + "_" + i
                await storage._saveToDb(TABLE_TOP_VIDEOS, key, video);
            }
            resolve(true);
        } catch (err) {
            console.log(err)
            reject(err);
        }
    })

}

storage.checkTop5VideosByDate = function (startMoment, endMoment) {
    return new Promise(async function (resolve) {
        if (!startMoment || !endMoment)
            return resolve(false);


        const dateEnd = startMoment.format("YYYY-MM-DD");
        const dateStart = endMoment.format("YYYY-MM-DD");


        console.log({ dateStart, dateEnd })
        var query = datastore.createQuery(TABLE_TOP_VIDEOS) //check if the column dateStr starts with date
            .filter('dateStr', '>=', dateStart)
            .filter('dateStr', '<=', dateEnd)
            .limit(5);

        const [entities] = await datastore.runQuery(query);
        //console.log("Top videos that we already have:", {entities})
        if (entities.length === 5) {
            resolve(entities);
        } else {
            resolve(false);
        }

    })

}


module.exports = storage;