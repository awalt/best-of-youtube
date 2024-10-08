const fs = require('fs');
const {YoutubeTranscript} = require('youtube-transcript');
const ytdl = require('ytdl-core');

const getYoutubeTranscriptAndInfo = async function (videoId) {
    try {
        let transcript = "";
        try {
            console.log(typeof YoutubeTranscript.fetchTranscript)
            transcript = await YoutubeTranscript.fetchTranscript(videoId);
        } catch (err) {
            console.log("Transcript not available", err)
        }


        // Combine all transcript text into a single string
        let fullText = transcript ? transcript.reduce((acc, curr) => acc + curr.text + '\n', '') : "-no transcript available-";
        //Trim the fulltext if it's more than 15,000 characters
        if (fullText.length > 15000) {
            fullText = fullText.substring(0, 15000) + "...";
        }

        const info = await ytdl.getInfo(videoId);
        const videoTitle = info.videoDetails.title;
        const description = info.videoDetails.description;
        const uploadDate = info.videoDetails.uploadDate;


        // Save transcript to a text file (optional)
        //fs.writeFileSync('./data/transcript.txt', fullText);
        //fs.writeFileSync('./data/info.txt', JSON.stringify({videoTitle, description}));

        console.log('Transcript downloaded successfully!');
        //console.log(fullText); // Uncomment to print the transcript to the console
        return { transcript: fullText, title: videoTitle, description: description };

    } catch (error) {
        // Handle errors, such as video not found or transcript not available
        if (error.response && error.response.status === 404) {
            console.error(`Video with ID ${videoId} not found.`);
        } else {
            console.error('Error fetching transcript:', error);
        }
    }
}

module.exports = getYoutubeTranscriptAndInfo;