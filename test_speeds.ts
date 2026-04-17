import cloudscraper from 'cloudscraper';

const start = Date.now();

async function testSpeeds() {
    console.log("Testing fetch...");
    let t0 = Date.now();
    try {
        const res = await fetch('https://weebcentral.com/search/data?author=&text=Naruto&display_mode=Full+Display', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        });
        const text = await res.text();
        console.log(`Fetch took ${Date.now() - t0}ms, size: ${text.length}`);
    } catch(e) {
        console.log(`Fetch failed: ${e.message}`);
    }

    console.log("Testing cloudscraper...");
    t0 = Date.now();
    try {
        const text = await cloudscraper.get('https://weebcentral.com/search/data?author=&text=Naruto&display_mode=Full+Display');
        console.log(`Cloudscraper took ${Date.now() - t0}ms, size: ${text.length}`);
    } catch(e) {
        console.log(`Cloudscraper failed: ${e.message}`);
    }
}

testSpeeds();
