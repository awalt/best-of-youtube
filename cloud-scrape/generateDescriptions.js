const fs = require('fs');
const _ = require('underscore');


const storage = require('./storage');


let promptsFolder = `./prompts/`;
let videosFolder = `../nextjs/videyo/data/videos/`;

function checkIfValidJSON(contents) {
    try {
        JSON.parse(contents);

        if (!contents || contents.length < 100)
            return false;
        return true;
    } catch (error) {
        return false;
    }
}
function fixJSON2(json) {

    //remove everything before the first {
    json = json.substring(json.indexOf('{'));
    //remove everything after the last }
    json = json.substring(0, json.lastIndexOf('}') + 1);

    console.log({ json })


    function bulkRegex(str, callback) {
        if (callback && typeof callback === 'function') {
            return callback(str);
        } else if (callback && Array.isArray(callback)) {
            for (let i = 0; i < callback.length; i++) {
                if (callback[i] && typeof callback[i] === 'function') {
                    str = callback[i](str);
                } else { break; }
            }
            return str;
        }
        return str;
    }
    if (json && json !== '') {
        if (typeof json !== 'string') {
            try {
                json = JSON.stringify(json);
            } catch (e) { return false; }
        }
        if (typeof json === 'string') {
            json = bulkRegex(json, false, [
                str => str.replace(/[\n\t]/gm, ''),
                str => str.replace(/,\}/gm, '}'),
                str => str.replace(/,\]/gm, ']'),
                str => {
                    str = str.split(/(?=[,\}\]])/g);
                    str = str.map(s => {
                        if (s.includes(':') && s) {
                            let strP = s.split(/:(.+)/, 2);
                            strP[0] = strP[0].trim();
                            if (strP[0]) {
                                let firstP = strP[0].split(/([,\{\[])/g);
                                firstP[firstP.length - 1] = bulkRegex(firstP[firstP.length - 1], false, p => p.replace(/[^A-Za-z0-9\-_]/, ''));
                                strP[0] = firstP.join('');
                            }
                            let part = strP[1].trim();
                            if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith('\'') && part.endsWith('\'')) || (part.startsWith('`') && part.endsWith('`'))) {
                                part = part.substr(1, part.length - 2);
                            }
                            part = bulkRegex(part, false, [
                                p => p.replace(/(["])/gm, '\\$1'),
                                p => p.replace(/\\'/gm, '\''),
                                p => p.replace(/\\`/gm, '`'),
                            ]);
                            strP[1] = ('"' + part + '"').trim();
                            s = strP.join(':');
                        }
                        return s;
                    });
                    return str.join('');
                },
                str => str.replace(/(['"])?([a-zA-Z0-9\-_]+)(['"])?:/g, '"$2":'),
                str => {
                    str = str.split(/(?=[,\}\]])/g);
                    str = str.map(s => {
                        if (s.includes(':') && s) {
                            let strP = s.split(/:(.+)/, 2);
                            strP[0] = strP[0].trim();
                            if (strP[1].includes('"') && strP[1].includes(':')) {
                                let part = strP[1].trim();
                                if (part.startsWith('"') && part.endsWith('"')) {
                                    part = part.substr(1, part.length - 2);
                                    part = bulkRegex(part, false, p => p.replace(/(?<!\\)"/gm, ''));
                                }
                                strP[1] = ('"' + part + '"').trim();
                            }
                            s = strP.join(':');
                        }
                        return s;
                    });
                    return str.join('');
                },
            ]);
            return json;
        }
        return json;
    }
    return json;
}


function selectFirstJson(str) {
    const jsonRegex = /{.*?}/gs; // Regular expression to match JSON objects
    const jsonObjects = [];

    let match;
    while ((match = jsonRegex.exec(str)) !== null) {
        jsonObjects.push(match[0]);
    }

    console.log("Select first", jsonObjects)

    if (jsonObjects.length)
        return jsonObjects[0];

    return jsonObjects;
}

function fixInvalidJSON3(jsonString) {
    // Replace single backslashes with double backslashes
    jsonString = jsonString.replace(/\\/g, '\\\\');

    // Replace single quotes with double quotes
    jsonString = jsonString.replace(/'/g, '"');

    // Remove trailing commas from arrays and objects
    jsonString = jsonString.replace(/,(?=\s*?[\}\]])/g, '');

    // Remove single line comments (//)
    jsonString = jsonString.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments (/* */)
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');

    // Trim leading and trailing spaces
    jsonString = jsonString.trim();

    // Fix common syntax issues
    // Ensure property names are quoted
    jsonString = jsonString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');


    //Remove from `"timeAdded"` to `Z"`, inclusive
    jsonString = jsonString.replace(/\"timeAdded.*Z\"\,/g, '');



    // Fix trailing commas before closing braces
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

    // Ensure property names are quoted
    jsonString = jsonString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');


    return jsonString
}


async function run(model, input) { //run the llm prompt
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


async function main() {

    let countNewVideos = 0;
    let prompts = await storage.getLatestPrompts(5);
    //randomize the order
    prompts = prompts.sort(() => Math.random() - 0.5);
    //keep the first 2 only
    prompts = prompts.slice(0, 2);


    //console.log(prompts);

    // Open each file and console.log its contents
    for (const prompt of prompts) {

        let contents = prompt.prompt
        let file = prompt.videoId;
        let videoId = prompt.videoId;
        let doesVideoFileAlreadyExist = await storage.checkIfVideoExists(videoId);


        let isValid = checkIfValidJSON(contents);
        let fileSize = contents.length;
        const MAX_SIZE = 6144;

        if (doesVideoFileAlreadyExist) {
            console.log("Video file already exists, skip. File: " + file)
        } else if (fileSize < 2000) {
            console.log("Small file, skip")
        } else if (isValid) {
            console.log(file + ' is valid JSON, skip. File size: ' + fileSize + ' bytes');

        } else {
            console.log(file + ' prompt File size: ' + fileSize + ' bytes');
            //Show the first 100 characters of contents to console.log
            //console.log(contents.substring(0, 100) + '...');

            //Trim any line that is longer than 250 characters.  Just add ... after 250 characters
            if (contents.length > MAX_SIZE) {
                contents = contents.split('\n').map(line => {
                    if (line.length > 325) {
                        return line.substring(0, 310) + '...';
                    } else {
                        return line;
                    }
                }).join('\n');
            }

            //Trim contents to make 6500 characters
            contents = contents.substring(0, MAX_SIZE);

            console.log(contents.substring(0, 150) + "...")



            console.log("Prompt number of characters: " + contents.length + " bytes. File: " + file)


            let model = "@cf/meta/llama-2-7b-chat-int8"
            model = "@hf/mistral/mistral-7b-instruct-v0.2"
            model = "@cf/fblgit/una-cybertron-7b-v2-bf16"
            model = "@cf/meta/llama-3-8b-instruct"
            //model = "@cf/meta/llama-3.1-8b-instruct"
            
            const response = await run(model, {
                messages: [
                    {
                        role: "system",
                        content: "You are a youtube video sumarizer. You ouput JSON only.",
                    },
                    {
                        role: "user",
                        content: contents
                    },
                ],
            })

            console.log({ response })
            console.log("RESULT: " + typeof response.result.response)
            console.log("success:" + response.success)
            console.log(response);

            let isSuccess = response.success && /videoTitle/.test(response.result.response);

            if (!isSuccess) {
                console.log("Not success, skip.")
                continue;
            }

            video = selectFirstJson(fixJSON2(response.result.response));
            let isValid = checkIfValidJSON(video);


            let videoLength = typeof video == "string" ? video.length : 0;



            console.log({ video, isValid, videoLength }, typeof video)


            if (typeof video == "string" && videoLength < 250) {
                console.log("Video is too short, skip. " + video.length)

            } else if (isSuccess) {
                console.log("OK to contrinue to saving to file " + file);

                if (isValid) {
                    if (typeof video === 'string') {
                        try {
                            video = JSON.parse(video);
                        } catch (e) {
                            console.log("Couldnt parse, final")
                        }
                    } else {
                        console.log("video not a string. it's: " + typeof video)
                    }

                    if (typeof video === 'object') {

                        //merge the contents of prompt (but omit prompt.prompt) into video, where the existing properties of video take precedence
                        video = _.extend(video, prompt, { prompt: undefined });


                        //add the now time 
                        video.timeAdded = new Date().toISOString();
                        video.videoId = videoId;

                        //video = JSON.stringify(video, null, 2);

                        //Add some raw data about the video (from youtube api and reddit api basically) to the stuff the llm generated
                        _.each(["videoInfo", "youtubeInfo", "post", "social_data"], key => {
                            if (video[key]) {
                                video[key] = video[key]
                            }
                        })

                        await storage.saveVideo(video);
                        await storage.deletePrompt(videoId);
                        countNewVideos++;

                        //console.log(video)
                        console.log(typeof video)
                        console.log("Saved to file. File: " + file);


                    } else {
                        console.log("video not an object. Not saving. it's: " + typeof video)
                    }


                } else {
                    console.log("Not valid parsed video.")
                    console.log(video)
                }

                if (!video) {
                    console.log("Video is null, skip.")
                } else {

                }

            } else {
                console.log("Not valid JSON video summary object");
            }




            console.log("Done. File: " + file);
        }
    }

    console.log("Done the whole loop")

    if (countNewVideos > 0) {
        //Trigger this hook: https://api.vercel.com/v1/integrations/deploy/prj_1rxJ4U0gFcw0rhRBkhHrSM37W4dd/o3DPABLUhY
        console.log("Triggering Vercel deploy hook via post to URL")
        const url = process.env.VERCEL_DEPLOY_HOOK_URL
        const response = await fetch(url, {
            method: 'POST',

        })

        console.log("Vercel deploy hook response: " + response.status)
    } else {
        console.log("No new videos to save. Not triggering Vercel deploy hook.")
    }




    console.log("Done.")


}

module.exports = main;