import * as cheerio from 'cheerio';

async function testWeb() {
  const keyword = 'naruto';
  const searchUrl = `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`;
  
  const response = await fetch(searchUrl);
  const html = await response.text();
  console.log('HTML preview:', html.slice(0, 1500));
}
testWeb();
