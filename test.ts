import * as cheerio from 'cheerio';

async function testWeb() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`;
  console.log('Fetching', searchUrl);
  
  const response = await fetch(searchUrl);
  const html = await response.text();
  
  console.log('HTML Length:', html.length);
  // console.log('HTML snippet:', html.slice(0, 500));
  
  const $ = cheerio.load(html);
  
  const results: any[] = [];
  $('article').each((_, el) => {
      const titleElem = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3');
      const title = titleElem.first().text().trim() || $(el).attr('title') || $(el).find('img').attr('alt');
      const link = $(el).find('a').first().attr('href') || $(el).closest('a').attr('href');
      const image = $(el).find('img').attr('src') || $(el).find('source').attr('srcset');

      if (title && link) {
        results.push({ title, link, image });
      }
  });
  
  console.log('Results from article:', results.length);
  
  if (results.length === 0) {
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/series/')) {
            const img = $(el).find('img').attr('src') || $(el).find('source').attr('srcset');
            const titleText = $(el).text().replace(/\s+/g, ' ').trim() || $(el).attr('title') || $(el).find('img').attr('alt');
            
            if (img && titleText && !results.some(r => r.link === href)) {
                results.push({ title: titleText, link: href, image: img });
            }
        }
    });
    console.log('Results from anchor fallback:', results.length);
    if(results.length > 0) {
        console.log('Sample fallback result:', results[0]);
    }
  } else {
    console.log('Sample result:', results[0]);
  }
}
testWeb();
