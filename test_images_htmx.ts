import cloudscraper from 'cloudscraper';

async function fetchChapterImages() {
  const chapterId = '01KN8A4XQXJRJXJQ8HF6TPEYS6';
  const url = `https://weebcentral.com/chapters/${chapterId}/images?is_prev=False&current_page=1`;
  
  try {
    const html = await cloudscraper.get(url);
    console.log('HTML Length:', html.length);
    console.log('Snippet:', html.slice(0, 1000));
  } catch (err) {
    console.error('Error fetching', err);
  }
}
fetchChapterImages();
