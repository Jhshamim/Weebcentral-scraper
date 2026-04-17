import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testFullPipeline() {
   const anilistId = 170400;
   const cpNumber = "25"; // Test finding chapter 25

   // 1. Fetch Anilist Title
   const query = `
      query ($id: Int) {
         Media (id: $id, type: MANGA) {
            title { english romaji }
         }
      }
   `;
   const alRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: anilistId } })
   });
   const alData = await alRes.json();
   const titles = alData.data?.Media?.title;
   let searchTitle = titles?.english || titles?.romaji;
   console.log('Anilist Title:', searchTitle);

   // 2. Search Weebcentral
   const searchUrl = `https://weebcentral.com/search/data?author=&text=${encodeURIComponent(searchTitle)}&display_mode=Full+Display`;
   let wcHtml = '';
   try {
      wcHtml = await cloudscraper.get(searchUrl);
   } catch(e) {
      console.log('Use fallback fetch');
      const r = await fetch(searchUrl, { headers: { 'User-Agent': "Mozilla/5.0"} });
      wcHtml = await r.text();
   }
   
   const $ = cheerio.load(wcHtml);
   let matchedId = null;

   const checkMatch = (t1, t2) => t1.toLowerCase().trim() === t2.toLowerCase().trim();

   $('a.link.link-hover.line-clamp-1').each((_, el) => {
      if(!matchedId) {
         const title = $(el).text();
         if (checkMatch(title, searchTitle)) {
            const href = $(el).attr('href');
            if (href) {
               const m = href.match(/\/series\/([^\/]+)/);
               if (m) matchedId = m[1];
            }
         }
      }
   });

   // Fallback parsing if main fails
   if(!matchedId) {
      $('article').each((_, el) => {
         if(!matchedId) {
             const t = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3').first().text();
             if (checkMatch(t, searchTitle)) {
                const href = $(el).find('a').first().attr('href');
                if(href) {
                   const m = href.match(/\/series\/([^\/]+)/);
                   if (m) matchedId = m[1];
                }
             }
         }
      });
   }
   console.log('Matched Series ID:', matchedId);

   // 3. Get Chapters List
   if (!matchedId) return;
   const chapListUrl = `https://weebcentral.com/series/${matchedId}/full-chapter-list`;
   const chapListHtml = await cloudscraper.get(chapListUrl);
   const $cl = cheerio.load(chapListHtml);

   let matchedChapId = null;
   $cl('a[href*="/chapters/"]').each((_, el) => {
       const title = $cl(el).find('.flex.items-center.gap-2 span').first().text().trim() || $cl(el).text().replace(/\s+/g, ' ').trim();
       
       const numMatch = title.match(/(?:Chapter|Episode|Ch\.?|Ep\.?)\s*(\d+(?:\.\d+)?)/i);
       if (numMatch && numMatch[1] === cpNumber) {
           const href = $cl(el).attr('href');
           if (href) {
              const m = href.match(/\/chapters\/([^\/]+)/);
              if (m) matchedChapId = m[1];
           }
       }
   });
   console.log(`Matched Chapter ID for CP ${cpNumber}:`, matchedChapId);

   // 4. Get Images payload
   if(!matchedChapId) return;
   const imagesUrl = `https://weebcentral.com/chapters/${matchedChapId}/images?reading_style=long_strip`;
   const imagesHtml = await cloudscraper.get(imagesUrl);
   const $img = cheerio.load(imagesHtml);
   const images = [];
   $img('img').each((_, el) => {
       const src = $img(el).attr('src');
       if(src) images.push(src);
   });
   
   console.log(`Found ${images.length} images.`);
   console.log(images.slice(0, 2));

}
testFullPipeline();
