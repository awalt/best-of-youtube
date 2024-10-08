const fs = require('fs');
const cheerio = require('cheerio');

// Read the HTML file
//const html = fs.readFileSync('./html/reddit0.html', 'utf8');

const extractPosts = (html) => {

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Array to store the extracted posts
    const posts = [];

    // Find all the post containers
    $('div.thing').each((index, element) => {
        const post = {};

        // Extract the post title
        post.title = $(element).find('a.title').text().trim();

        // Extract the post URL
        post.url = $(element).find('a.title').attr('href');

        // Extract the comments link
        post.commentsLink = $(element).find('a.comments').attr('href');

        // Extract the subreddit
        post.subreddit = $(element).find('a.subreddit').text().trim();

        // Extract the author
        post.author = $(element).find('a.author').text().trim();

        // Add the post to the array
        posts.push(post);
    });

    // Print the extracted posts
    console.log(posts);
    return posts;
}

module.exports = extractPosts;