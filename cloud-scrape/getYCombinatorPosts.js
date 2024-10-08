const cheerio = require('cheerio');
const fetch = require('node-fetch');

const extractPostsFromYCombinator = async () => {
    // Fetch HTML of Y Combinator's news page
    return new Promise(async (resolve, reject) => {
        try {
            const URL = 'https://news.ycombinator.com/';
            const response = await fetch(URL);
            const html = await response.text();

            const $ = cheerio.load(html);
            const posts = [];

            // Find all post elements
            $('tr.athing').each((index, element) => {
                const $postElement = $(element);
                const id = $postElement.attr('id');
                const $titleElement = $postElement.find('.titleline > a');



                const title = $titleElement.text().trim();
                const url = $titleElement.attr('href');


                console.log({ title, url })


                posts.push({
                    title,
                    url: url.startsWith('http') ? url : `https://news.ycombinator.com/${url}`,
                    commentsLink: `https://news.ycombinator.com/item?id=${id}`,
                });
            });

            //Which posts are links to youtube videos?
            const youtubePosts = posts.filter((post) => {
                return post.url.includes('youtube') || post.url.includes('youtu.be');
            })

            console.log({youtubePosts})
            
            resolve(youtubePosts);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = extractPostsFromYCombinator;