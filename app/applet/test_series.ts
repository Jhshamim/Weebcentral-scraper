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
        
        details.title = $('h1').first().text().trim();
        details.description = $('p').first().text().trim();
        details.author = $('strong:contains("Author")').parent().text().replace('Author(s):', '').trim() || $('a[href*="?author="]').text().trim();
        
        const tags: string[] = [];
        $('a[href*="/search?tag="]').each((i, el) => {
            tags.push($(el).text().trim());
        });
        details.tags = tags;

        details.image = $('picture img').attr('src') || $('img.rounded').attr('src');
        
        const chapters: any[] = [];
        $('a[href*="/chapters/"]').each((i, el) => {
           chapters.push({
               title: $(el).text().replace(/\s+/g, ' ').trim(),
               id: $(el).attr('href')?.split('/chapters/')[1]
           });
        });
        
        console.log('Details:', details);
        console.log('Found chapters:', chapters.length);
        if (chapters.length > 0) console.log(chapters.slice(0, 3));
        
        const hxGets: string[] = [];
        $('[hx-get]').each((i, el) => {
           hxGets.push($(el).attr('hx-get') as string);
        });
        console.log('hx-gets:', hxGets);
        
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
testSeriesPage();
