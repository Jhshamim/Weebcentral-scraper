import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function verifyHtml() {
    const url = `https://weebcentral.com/search/data?author=&text=naruto&display_mode=Full+Display`;
    const html = await cloudscraper.get(url);
    const $ = cheerio.load(html);
    
    const results = [];
    $('a.link.link-hover.line-clamp-1').each((_, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr('href');
        // The image is inside the previous section, let's look up to the common container if possible
        // Actually, Weebcentral usually wraps both sections in a container of some sort. Let's find out.
        const parentDiv = $(el).closest('section').parent();
        
        // Find an image inside the same parent div
        const image = parentDiv.find('img').attr('src') || parentDiv.find('source').attr('srcset');

        if (title && link) {
           results.push({ title, link, image });
        }
    });

    console.log(`Found ${results.length} titles directly.`);
    console.log(results.slice(0, 3));
}

verifyHtml();
