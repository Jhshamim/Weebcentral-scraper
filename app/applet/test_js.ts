import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testWeb() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`;
  
  try {
    const html = await cloudscraper.get(searchUrl);
    console.log('HTML Length:', html.length);
    console.log('HTML snippet:', html.slice(0, 500));
    
    // Parse using cheerio
    const $ = cheerio.load(html);
    const results: any[] = [];
    
    // Search anchors
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/series/')) {
            const title = $(el).text().replace(/\s+/g, ' ').trim() || $(el).attr('title');
            const img = $(el).find('img').attr('src') || $(el).find('source').attr('srcset');
            // Log what we find for series anchors to debug
            console.log('Found series anchor:', {href, title, img, inner: $(el).html()?.slice(0, 50)});
        }
    });

  } catch (err) {
    console.error('Cloudscraper error:', err);
  }
}
testWeb();
