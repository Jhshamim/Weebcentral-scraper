import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function verifyHtml() {
    const url = `https://weebcentral.com/search/data?author=&text=naruto&display_mode=Full+Display`;
    const html = await cloudscraper.get(url);
    const $ = cheerio.load(html);
    
    console.log('Article 1 HTML:', $('article').first().html());
}

verifyHtml();
