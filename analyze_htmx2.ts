import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('weeb_full_search.html', 'utf8');
const $ = cheerio.load(html);

// Find elements with hx-get
$('[hx-get]').each((i, el) => {
    console.log('Element tag:', el.name);
    console.log('hx-get:', $(el).attr('hx-get'));
    console.log('hx-include:', $(el).attr('hx-include'));
    console.log('hx-vals:', $(el).attr('hx-vals'));
});

// Let's also check the search form parameters
console.log("\nForm inputs:");
$('input, select').each((i, el) => {
    console.log($(el).attr('name'), $(el).attr('type'), $(el).attr('value'));
});
