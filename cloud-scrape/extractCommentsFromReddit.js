const fs = require('fs');
const cheerio = require('cheerio');


const extractCommentsFromHTML = function (html) {

    //return promise
    return new Promise((resolve, reject) => {


        // Load the HTML into Cheerio
        const $ = cheerio.load(html);

        // Extract post title, URL, and description
        const postTitle = $('h1').text().trim();
        const postDescription = $('meta[property="og:description"]').attr('content').trim();
        let postDestinationURL = ''; // Initialize postDestinationURL

        // Search for linked URLs in the post content
        $('div.entry').find('a').each((index, element) => {
            const href = $(element).attr('href');
            // Check if the href attribute is a valid URL
            if (href && href.startsWith('http')) {
                postDestinationURL = href;
                // Break out of the loop once the first valid URL is found
                return false;
            }
        });

        // Extract top 5 root comments and their first replies (if available)
        const comments = [];
        $('div.comment').slice(0, 5).each((index, element) => {
            const rootComment = {
                author: $(element).find('a.author').text().trim(),
                content: $(element).find('div.md').text().trim(),
                replies: []
            };
            const reply = $(element).find('div.child').find('div.comment').first();
            if (reply.length) {
                const replyContent = reply.find('div.md').text().trim();
                const replyAuthor = reply.find('a.author').text().trim();
                rootComment.replies.push({ author: replyAuthor, content: replyContent });
            }
            comments.push(rootComment);
        });

        // Log extracted information
        /*console.log('Post Title:', postTitle);
        console.log('Post Description:', postDescription);
        console.log('Top 5 Root Comments:');
        comments.forEach((comment, index) => {
            console.log(`${index + 1}. Author: ${comment.author}`);
            console.log(`   Content: ${comment.content}`);
            if (comment.replies.length > 0) {
                console.log(`   First Reply:`);
                console.log(`      Author: ${comment.replies[0].author}`);
                console.log(`      Content: ${comment.replies[0].content}`);
            }
        });*/

        // Print the extracted posts
        //console.log({ postTitle, postDescription, comments })

        return resolve({ postTitle, postDestinationURL, postDescription, comments })
    })

}

module.exports = extractCommentsFromHTML;