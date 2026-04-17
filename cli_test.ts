async function curlSearch() {
  const r = await fetch('http://localhost:3000/api/search?keyword=naruto');
  const d = await r.json();
  console.log("Found results:", d.results.length);
  if (d.rawHtml) {
      console.log("Raw HTML snippet length:", d.rawHtml.length);
      console.log(d.rawHtml.slice(0, 1500));
  }
}
curlSearch();
