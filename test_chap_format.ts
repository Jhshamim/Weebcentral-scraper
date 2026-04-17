import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function testFormat() {
    const chapListUrl = `https://weebcentral.com/series/01JJCB7T8DYSR86CMK1ZYPCN7A/full-chapter-list`;
    const chapListHtml = await cloudscraper.get(chapListUrl);
    const $cl = cheerio.load(chapListHtml);

    $cl('a[href*="/chapters/"]').each((i, el) => {
        if(i > 3 && i < ($cl('a[href*="/chapters/"]').length - 3)) return; // log some from start and end
        const title = $cl(el).find('.flex.items-center.gap-2 span').first().text().trim() || $cl(el).text().replace(/\s+/g, ' ').trim();
        console.log(title);
    });
}
testFormat();
