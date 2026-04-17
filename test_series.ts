import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testSeriesPage() {
    const seriesId = '01J76XY7E827QQQT0ERKCGH4CD';
    const url = `https://weebcentral.com/series/${seriesId}`;
    
    try {
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);
        
        console.log('Title:', $('title').text());
        
        const details: any = {};
        
        // Let's try to find title, description, tags, author, etc.
        details.title = $('h1').first().text().trim();
        details.description = $('p').first().text().trim(); // Or look for specific markdown classes
        details.author = $('strong:contains("Author")').parent().text().replace('Author(s):', '').trim() || $('a[href*="?author="]').text().trim();
        
        // Tags
        const tags: string[] = [];
        $('a[href*="/search?tag="]').each((i, el) => {
            tags.push($(el).text().trim());
        });
        details.tags = tags;

        // Image
        details.image = $('picture img').attr('src');
        
        // Chapters list? If HTMX is used, it might be in another request, like /series/.../episodes or something. Let's see if there are chapter links
        const chapters: any[] = [];
        $('a[href*="/chapters/"]').each((i, el) => {
           chapters.push({
               title: $(el).text().replace(/\s+/g, ' ').trim(),
               url: $(el).attr('href'),
               id: $(el).attr('href')?.split('/chapters/')[1]
           });
        });
        
        console.log('Details:', details);
        console.log('Found chapters:', chapters.length);
        if (chapters.length > 0) console.log(chapters.slice(0, 3));
        
        // If chapters == 0, let's see if there is an hx-get for a chapter list
        const hxGets = [];
        $('[hx-get]').each((i, el) => {
           hxGets.push($(el).attr('hx-get'));
        });
        console.log('hx-gets:', hxGets);
        
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
testSeriesPage();
