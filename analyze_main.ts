import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('weeb_full_search.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

const links = [];
$('a').each((i, el) => {
   const href = $(el).attr('href');
   if (href && href.includes('/series/')) {
      const cls = $(el).attr('class') || '';
      links.push({ href: href, text: $(el).text().trim(), cls: $(el).attr('class') });
   }
});

console.log('Series links length:', links.length);

const results = [];
$('article').each((i, el) => {
    results.push({
        html: $(el).html()?.slice(0, 150)
    })
});

console.log('Articles:', results.length);
if (results.length > 0) {
    console.log('Article 1: ', results[0]);
} else {
    // If no articles, print some classes
    console.log('Sample links:', links.slice(0, 5));
}

