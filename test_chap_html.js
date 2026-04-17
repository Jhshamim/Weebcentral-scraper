import cloudscraper from 'cloudscraper';
import fs from 'fs';

async function checkChapterHtml() {
  const chapterId = '01KN8A4XQXJRJXJQ8HF6TPEYS6';
  const url = `https://weebcentral.com/chapters/${chapterId}`;
  
  try {
    const html = await cloudscraper.get(url);
    fs.writeFileSync('weeb_chapter.html', html);
    console.log('Saved to weeb_chapter.html. Length:', html.length);
  } catch (err) {
    console.error('Error fetching', err);
  }
}
checkChapterHtml();
