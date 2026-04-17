import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function fetchChapterImages() {
  const chapterId = '01KN8A4XQXJRJXJQ8HF6TPEYS6';
  const url = `https://weebcentral.com/chapters/${chapterId}/images?reading_style=long_strip`;
  
  try {
    const html = await cloudscraper.get(url);
    const $ = cheerio.load(html);
    const images: string[] = [];
    $('img').each((i, el) => {
        images.push($(el).attr('src'));
    });
    console.log(`Images found: ${images.length}`);
    console.log(images.slice(0, 5));
    
  } catch (err) {
    console.error(err);
  }
}
fetchChapterImages();
