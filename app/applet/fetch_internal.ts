import * as cheerio from 'cheerio';
async function test() {
  const url = `https://weebcentral.com/search/data?author=&text=none&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any`.replace('none', 'naruto');
  const r = await fetch(url);
  const html = await r.text();
  console.log("HTML START\n", html.slice(0, 1000));
}
test();
