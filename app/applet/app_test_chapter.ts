import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testChapterPage() {
    const chapterId = '01J76XYYR89NRTPDSE4E86HY7F';
    const url = `https://weebcentral.com/chapters/${chapterId}`;
    
    try {
        const html = await cloudscraper.get(url);
        const $ = cheerio.load(html);
        
        console.log('Title:', $('title').text());
        
        const pageImages: string[] = [];
        $('section.w-full picture img').each((i, el) => {
             pageImages.push($(el).attr('src') || $(el).attr('data-src') || '');
        });
        console.log(`Found ${pageImages.length} section picture images.`);

        if (pageImages.length === 0) {
            $('img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && src.includes('temp.compsci88.com')) {
                    pageImages.push(src);
                }
            });
            console.log(`Found ${pageImages.length} temp.compsci88 images.`);
        }
        
        console.log("Samples:", pageImages.slice(0, 3));

        // Check if there's any HTMX request for pages
        const hxGets: string[] = [];
        $('[hx-get]').each((i, el) => {
           hxGets.push($(el).attr('hx-get') as string);
        });
        console.log('hx-gets:', hxGets);

        // Check for scripts
        const scripts: string[] = [];
        $('script').each((i, el) => {
            scripts.push($(el).html() || '');
        });
        // Look for image arrays in scripts
        for (const script of scripts) {
            if (script.includes('.jpg') || script.includes('.png')) {
                console.log("Script with images:", script.slice(0, 500));
            }
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
testChapterPage();
