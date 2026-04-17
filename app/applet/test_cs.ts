import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testWeb() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`;
  
  try {
    const html = await cloudscraper.get(searchUrl);
    console.log('HTML Length:', html.length);
    console.log('HTML snippet:', html.slice(0, 1000));
    
    // Parse using cheerio
    const $ = cheerio.load(html);
    const results: any[] = [];
    
    // According to Weebcentral, data endpoint might return pure articles or something
    $('article').each((_, el) => {
         const titleElem = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3');
         const title = titleElem.first().text().trim() || $(el).attr('title') || $(el).find('img').attr('alt');
         const link = $(el).find('a').first().attr('href') || $(el).closest('a').attr('href');
         const image = $(el).find('img').attr('src') || $(el).find('source').attr('srcset');

         if (title && link) {
           results.push({ title, link, image });
         }
    });

    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/series/')) {
            const title = $(el).text().replace(/\\s+/g, ' ').trim();
            const img = $(el).find('img').attr('src');
            // Log what we find for series anchors to debug
            console.log('Found series anchor:', {href, title, img, inner: $(el).html()?.slice(0, 50)});
        }
    });
    
    console.log('Results from articles:', results.length);
  } catch (err) {
    console.error('Cloudscraper error:', err);
  }
}
testWeb();
