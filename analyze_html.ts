import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('weeb_full_response.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

const links = [];
$('a').each((i, el) => {
   const href = $(el).attr('href');
   if (href) {
      links.push(href);
   }
});
console.log('Number of links:', links.length);
console.log('Sample links:', links.slice(0, 15));

const imgs = [];
$('img').each((i, el) => {
   imgs.push($(el).attr('src'));
});
console.log('Images:', imgs.length);

console.log('Article count:', $('article').length);
console.log('Div with class text-lg count:', $('.text-lg').length);
