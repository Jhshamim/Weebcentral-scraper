import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('weeb_chapter.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

const allImgs = [];
$('img').each((i, el) => {
    allImgs.push({ src: $(el).attr('src'), alt: $(el).attr('alt') });
});
console.log('All imgs:', allImgs.length);
console.log(allImgs.slice(0, 5));

const pictureImgs = [];
$('picture').each((i, el) => {
    pictureImgs.push($(el).html());
});
console.log('\nPictures:', pictureImgs.length);
if (pictureImgs.length > 0) {
    console.log("Picture 1:", pictureImgs[0].slice(0, 300));
}

// Check htmx
console.log("\nHTMX Gets:");
$('[hx-get]').each((i, el) => {
    console.log($(el).attr('hx-get'));
});

// Any section representing the reader?
console.log("\nClasses with reader or page:");
$('[class*="reader"], [class*="page"]').each((i, el) => {
    console.log($(el).attr('class'));
});
