import cloudscraper from 'cloudscraper';

async function fetchChapterImages() {
  const chapterId = '01KN8A4XQXJRJXJQ8HF6TPEYS6';
  const url = `https://weebcentral.com/chapters/${chapterId}/images?reading_style=long_strip`;
  
  try {
    const html = await cloudscraper.get(url);
    console.log('HTML Length:', html.length);
    console.log('Snippet:', html.slice(0, 500));
  } catch (err) {
    if(err.statusCode) {
       console.error("400 error caught");
    } else {
       console.error('Error fetching', err);
    }
  }
}
fetchChapterImages();
