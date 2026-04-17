import cloudscraper from 'cloudscraper';
import fs from 'fs';

async function checkActualHtml() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`;
  
  try {
    const html = await cloudscraper.get(searchUrl);
    fs.writeFileSync('weeb_full_response.html', html);
    console.log('Saved to weeb_full_response.html. Length:', html.length);
  } catch (err) {
    console.error('Error fetching', err);
  }
}
checkActualHtml();
