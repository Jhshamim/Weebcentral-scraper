import fs from 'fs';

async function testAnilist() {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: MANGA) {
        title {
          english
          romaji
        }
      }
    }
  `;
  const variables = { id: 170400 };
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testAnilist();
