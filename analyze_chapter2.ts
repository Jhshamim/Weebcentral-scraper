import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('weeb_chapter.html', 'utf8');
const $ = cheerio.load(html);

// Look for anything with /images?
console.log("Images HTMX references:");
$('[hx-get*="/images"]').each((i, el) => {
    console.log($(el).attr('hx-get'));
});

// Any script defining page URLs?
const scripts = [];
$('script').each((i, el) => {
    scripts.push($(el).html() || '');
});
for (const script of scripts) {
    if (script.includes('.jpg') || script.includes('.png') || script.includes('.webp')) {
        console.log("\nScript with images found:");
        console.log(script.slice(0, 1000));
    }
}
