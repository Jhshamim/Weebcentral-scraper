import cloudscraper from 'cloudscraper';

async function testFetch() {
  const keyword = 'naruto';
  // Let's emulate what the form literally outputs.
  // author=&text=naruto&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any&display_mode=Full+Display
  const urlsToTest = [
     `https://weebcentral.com/search/data?author=&text=${keyword}&display_mode=Full+Display`,
     `https://weebcentral.com/search/data?text=${keyword}&display_mode=Full+Display`,
     `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best+Match&order=Ascending&official=Any&anime=Any&adult=Any&display_mode=Full%20Display`,
     `https://weebcentral.com/search/data?author=&text=${keyword}&sort=Best%20Match&order=Ascending&official=Any&anime=Any&adult=Any&display_mode=Full%20Display`
  ];

  for (const url of urlsToTest) {
     console.log('Testing:', url);
     try {
       const resp = await cloudscraper.get(url);
       console.log('SUCCESS! Length:', resp.length);
     } catch (e) {
       console.log('FAILED:', e.statusCode || e.message);
     }
  }
}
testFetch();
