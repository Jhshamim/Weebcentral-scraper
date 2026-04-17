import cloudscraper from 'cloudscraper';
import fs from 'fs';

async function checkActualHtml() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search?text=${keyword}`;
  console.log("Fetching", searchUrl);
  try {
    const html = await cloudscraper.get(searchUrl);
    fs.writeFileSync('weeb_full_search.html', html);
    console.log('Saved to weeb_full_search.html. Length:', html.length);
  } catch (err) {
    console.error('Error fetching', err);
  }
}
checkActualHtml();
