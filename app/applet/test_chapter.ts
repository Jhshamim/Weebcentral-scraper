import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testChapterPage() {
    const chapterId = '01J76XYYR89NRTPDSE4E86HY7F';
    const url = `https://weebcentral.com/chapters/${chapterId}`;
    
    try {
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);
        
        console.log('Title:', $('title').text());
        
        let images: string[] = [];
        // Typically, manga reader pages have images in a specific container, or standard img tags inside a main reading column.
        // Let's look for images in section or main, or any img that looks like a page.
        $('img').each((i, el) => {
           const src = $(el).attr('src');
           if (src && !src.includes('avatar') && !src.includes('logo')) {
               images.push(src);
           }
        });
        
        console.log(`Found ${images.length} images overall.`);
        
        // Sometimes the images are rendered dynamically or stored in a script. Let's check a specific reader container if one exists.
        // Weebcentral uses a custom reader or typical looping. Let's see if we can find something with `alt="Page..."` or inside a specific class.
        const pageImages: string[] = [];
        $('picture img, section img, .reader img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src) {
                pageImages.push(src);
            }
        });
        console.log(`Found ${pageImages.length} picture/section images.`);
        if (pageImages.length > 0) {
            console.log(pageImages.slice(0, 3));
        }

        // Just in case, let's look for htmx calls that might load pages
        const hxGets: string[] = [];
        $('[hx-get]').each((i, el) => {
           hxGets.push($(el).attr('hx-get') as string);
        });
        console.log('hx-gets:', hxGets);

        // Also check section with id
        console.log("Sections with ID:", $('section[id]').length);

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
testChapterPage();
