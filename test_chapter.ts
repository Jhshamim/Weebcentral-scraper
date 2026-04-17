import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testChapterPage() {
    const chapterId = '01J76XYYR89NRTPDSE4E86HY7F';
    const url = `https://weebcentral.com/chapters/${chapterId}`;
    
    try {
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);
        
        console.log('Title:', $('title').text());
        
        // Let's find images specific to chapter reading. WeebCentral images usually are placed directly in a section or a flex column.
        const allImages: string[] = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            allImages.push(src || '');
        });
        // filter out logos or avatars if needed, usually chapter pages are served from a specific domain
        const pageImages = allImages.filter(src => src && !src.includes('avatar') && !src.includes('logo'));
        
        console.log(`Found ${pageImages.length} images.`);
        if (pageImages.length > 0) {
            console.log("Samples:", pageImages.slice(0, 3));
        }

        // Check if there's any HTMX request for pages
        // Many new sites use HTMX to fetch pages dynamically /chapters/ID/images/ID etc.
        const hxGets: string[] = [];
        $('[hx-get]').each((i, el) => {
           hxGets.push($(el).attr('hx-get') as string);
        });
        console.log('hx-gets:', hxGets);
        
        // Sometimes images are loaded via a specific endpoint containing images
        if (hxGets.some(x => x.includes('images'))) {
           console.log("Has images hx-get!");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
testChapterPage();
