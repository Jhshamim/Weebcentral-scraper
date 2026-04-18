import express from 'express';
import * as cheerio from 'cheerio';
import path from 'path';
import cloudscraper from 'cloudscraper';
import cors from 'cors';

// Global caches
const anilistToSeriesCache = new Map<string, string>(); // '170400' -> '01JJCB7T...'
const seriesChaptersCache = new Map<string, { [num: string]: string }>(); // '01JJCB...' -> { '25': '01KK...' }
const seriesChaptersListCache = new Map<string, any[]>(); // '01JJCB...' -> [{ title, number, id }, ...]

const app = express();
const PORT = process.env.PORT || 3000;

// Enable robust CORS for all routes (Allows other sites/apps to hit the API including PREFLIGHT requests)
app.use(cors({
  origin: '*', // Allow all domains
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/search', async (req, res) => {
    try {
      const { keyword } = req.query;
      if (!keyword) {
        res.status(400).json({ error: 'Keyword is required' });
        return;
      }

      // Fetch the search page using cloudscraper to bypass Cloudflare
      const searchUrl = `https://weebcentral.com/search/data?author=&text=${encodeURIComponent(keyword as string)}&display_mode=Full+Display`;
      
      let html = '';
      try {
        html = await cloudscraper.get(searchUrl);
      } catch (err) {
        console.error('Cloudscraper error:', err);
        // Fallback to fetch if cloudscraper fails
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/html'
          }
        });
        html = await response.text();
      }

      const $ = cheerio.load(html);
      const results: any[] = [];

      $('a.link.link-hover.line-clamp-1').each((_, el) => {
        const titleText = $(el).text().trim();
        const href = $(el).attr('href');
        
        let id = null;
        if (href) {
           const match = href.match(/\/series\/([^\/]+)/);
           if (match) id = match[1];
        }

        // Find container to extract image
        const parentDiv = $(el).closest('section').parent();
        const img = parentDiv.find('img').attr('src') || parentDiv.find('source').attr('srcset');

        if (titleText && id) {
           results.push({ id, title: titleText, image: img || null });
        }
      });
      
      // Fallback if Weebcentral returns a different display mode payload
      if (results.length === 0) {
          $('article').each((_, el) => {
             const titleElem = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3');
             const title = titleElem.first().text().trim() || $(el).attr('title') || $(el).find('img').attr('alt');
             const href = $(el).find('a').first().attr('href') || $(el).closest('a').attr('href');
             let image = $(el).find('img').attr('src') || $(el).find('source').attr('srcset');

             let id = null;
             if (href) {
                const match = href.match(/\/series\/([^\/]+)/);
                if (match) id = match[1];
             }

             if (title && id && title.toLowerCase() !== 'read') {
               results.push({ id, title, image: image || null });
             }
          });
      }

      res.json({ results, debugHtmlLength: html.length });
    } catch (error) {
      console.error('Search API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/manga/:id', async (req, res) => {
    try {
       const { id } = req.params;
       if (!id) return res.status(400).json({ error: 'ID is required' });

       const seriesUrl = `https://weebcentral.com/series/${id}`;
       const html = await cloudscraper.get(seriesUrl);
       const $ = cheerio.load(html);

       const details: any = {};
       details.id = id;
       details.title = $('h1').first().text().trim();
       details.description = $('p').first().text().trim();
       details.author = $('strong:contains("Author")').parent().text().replace('Author(s):', '').trim() || $('a[href*="?author="]').text().trim();
       details.image = $('picture img').attr('src') || $('img.rounded').attr('src');
       
       const tags: string[] = [];
       $('a[href*="/search?tag="]').each((i, el) => {
           tags.push($(el).text().trim());
       });
       details.tags = tags;

       // HTMX full chapter request
       let chaptersHtml = '';
       try {
           chaptersHtml = await cloudscraper.get(`https://weebcentral.com/series/${id}/full-chapter-list`);
       } catch(err) {
           console.error('Chapters HTMX failed:', err);
       }
       
       const $chap = cheerio.load(chaptersHtml);
       const chapters: any[] = [];
       $chap('a[href*="/chapters/"]').each((i, el) => {
          let cTitle = $chap(el).find('.flex.items-center.gap-2 span').first().text().trim();
          if(!cTitle) cTitle = $chap(el).text().replace(/\s+/g, ' ').trim();
          
          let cId = null;
          const href = $chap(el).attr('href');
          if (href) {
             const m = href.match(/\/chapters\/([^\/]+)/);
             if (m) cId = m[1];
          }

          if (cId) {
             chapters.push({
                 id: cId,
                 title: cTitle,
                 url: href
             });
          }
       });

       details.chapters = chapters;

       res.json(details);
    } catch (e: any) {
       console.error("Manga scraper error:", e);
       res.status(500).json({ error: 'Failed to fetch manga details' });
    }
  });

  app.get('/api/chapter/:id', async (req, res) => {
    try {
       const { id } = req.params;
       if (!id) return res.status(400).json({ error: 'ID is required' });

       // First fetch the reader shell to grab navigational links and chapter title
       const chapterUrl = `https://weebcentral.com/chapters/${id}`;
       let html = '';
       try {
           html = await cloudscraper.get(chapterUrl);
       } catch (err: any) {
           console.error('Initial chapter shell failed:', err.message);
       }

       const $ = cheerio.load(html);
       
       let images: string[] = [];
       
       // Now specifically hit the HTMX images endpoint that returns the payload dynamically
       const htmxImagesUrl = `https://weebcentral.com/chapters/${id}/images?reading_style=long_strip`;
       try {
           const htmxHtml = await cloudscraper.get(htmxImagesUrl);
           const $htmx = cheerio.load(htmxHtml);
           
           $htmx('img').each((_, el) => {
               const src = $htmx(el).attr('src');
               if (src) images.push(src);
           });
       } catch (err: any) {
           console.error("HTMX chapter image load failed:", err.message);
       }

       const nextChapterLinks = $('a:contains("Next")').map((_, el) => $(el).attr('href')).get();
       const prevChapterLinks = $('a:contains("Prev")').map((_, el) => $(el).attr('href')).get();

       res.json({
           id,
           title: $('title').text().replace(' | Weeb Central', '').trim(),
           images,
           debugImageCount: images.length,
           debugHtmlSnippet: images.length === 0 ? html.substring(0, 1000) : undefined,
           next: nextChapterLinks,
           prev: prevChapterLinks
       });
    } catch (e: any) {
       console.error("Chapter scraper error:", e);
       res.status(500).json({ error: 'Failed to fetch chapter details' });
    }
  });

  app.get('/api/chapter-list', async (req, res) => {
    try {
        const anilistId = req.query.id as string;

        if (!anilistId) {
            return res.status(400).json({ error: 'Missing id (AniList ID)' });
        }

        let matchedSeriesId = anilistToSeriesCache.get(anilistId);
        let searchTitle = '';

        if (!matchedSeriesId) {
            // 1. Fetch from AniList
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
            const alRes = await fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, variables: { id: parseInt(anilistId, 10) } })
            });
            
            if (!alRes.ok) return res.status(400).json({ error: 'Failed to fetch AniList data' });
            const alData = await alRes.json();
            const titles = alData.data?.Media?.title;
            if (!titles) return res.status(404).json({ error: 'Manga not found on AniList' });

            searchTitle = titles.english || titles.romaji;
            if (!searchTitle) return res.status(404).json({ error: 'Manga title not found from AniList' });

            // 2. Search WeebCentral
            const searchUrl = `https://weebcentral.com/search/data?author=&text=${encodeURIComponent(searchTitle)}&display_mode=Full+Display`;
            let wcHtml = '';
            try {
                wcHtml = await cloudscraper.get(searchUrl);
            } catch (err) {
                const response = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                wcHtml = await response.text();
            }

            const $ = cheerio.load(wcHtml);
            const checkMatch = (t1: string, t2: string) => t1.toLowerCase().trim() === t2.toLowerCase().trim();

            $('a.link.link-hover.line-clamp-1').each((_, el) => {
                if (!matchedSeriesId) {
                    const titleText = $(el).text();
                    if (checkMatch(titleText, searchTitle)) {
                        const href = $(el).attr('href');
                        if (href) {
                            const m = href.match(/\/series\/([^\/]+)/);
                            if (m) matchedSeriesId = m[1];
                        }
                    }
                }
            });

            if (!matchedSeriesId) {
                $('article').each((_, el) => {
                    if (!matchedSeriesId) {
                        const titleText = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3').first().text();
                        if (checkMatch(titleText, searchTitle)) {
                            const href = $(el).find('a').first().attr('href');
                            if (href) {
                                const m = href.match(/\/series\/([^\/]+)/);
                                if (m) matchedSeriesId = m[1];
                            }
                        }
                    }
                });
            }

            if (!matchedSeriesId) return res.status(404).json({ error: '100% Match not found on WeebCentral', searchTitle });
            anilistToSeriesCache.set(anilistId, matchedSeriesId);
        }

        // 3. Get Chapters Map
        let cachedList = seriesChaptersListCache.get(matchedSeriesId);
        
        if (!cachedList) {
            let chapListHtml = '';
            try {
                chapListHtml = await cloudscraper.get(`https://weebcentral.com/series/${matchedSeriesId}/full-chapter-list`);
            } catch (err: any) {
                console.error('Failed to load chapter list:', err.message);
            }

            const $cl = cheerio.load(chapListHtml);
            const chaptersMap: { [num: string]: string } = {};
            const chaptersArray: any[] = [];
            
            $cl('a[href*="/chapters/"]').each((_, el) => {
                const titleText = $cl(el).find('.flex.items-center.gap-2 span').first().text().trim() || $cl(el).text().replace(/\s+/g, ' ').trim();
                const numMatch = titleText.match(/(?:Chapter|Episode|Ch\.?|Ep\.?)\s*(\d+(?:\.\d+)?)/i);
                const extractedNum = numMatch ? numMatch[1] : null;
                const href = $cl(el).attr('href');
                let cid = null;
                if (href) {
                    const m = href.match(/\/chapters\/([^\/]+)/);
                    if (m) cid = m[1];
                }

                if (cid && titleText) {
                    chaptersArray.push({
                        title: titleText,
                        number: extractedNum,
                        id: cid
                    });
                    if (extractedNum) {
                        chaptersMap[extractedNum] = cid;
                    }
                }
            });
            
            seriesChaptersCache.set(matchedSeriesId, chaptersMap);
            cachedList = chaptersArray;
            seriesChaptersListCache.set(matchedSeriesId, cachedList);
        }

        res.json({
            anilistId,
            weebCentralSeriesId: matchedSeriesId,
            chapters: cachedList,
            isCached: true
        });
    } catch (e: any) {
        console.error("Chapter list scraper error:", e);
        res.status(500).json({ error: 'Internal server error while fetching chapter list' });
    }
  });

  app.get('/api/chapters', async (req, res) => {
    try {
        const anilistId = req.query.id as string;
        const cpNumber = req.query.cp as string;

        if (!anilistId || !cpNumber) {
            return res.status(400).json({ error: 'Missing id (AniList ID) or cp (Chapter Number)' });
        }

        let matchedSeriesId = anilistToSeriesCache.get(anilistId);
        let searchTitle = '';

        if (!matchedSeriesId) {
            // 1. Fetch from AniList
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
            const alRes = await fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, variables: { id: parseInt(anilistId, 10) } })
            });
            
            if (!alRes.ok) {
                return res.status(400).json({ error: 'Failed to fetch AniList data' });
            }
            const alData = await alRes.json();
            const titles = alData.data?.Media?.title;
            if (!titles) {
                return res.status(404).json({ error: 'Manga not found on AniList' });
            }

            searchTitle = titles.english || titles.romaji;
            if (!searchTitle) {
                return res.status(404).json({ error: 'Manga title not found from AniList' });
            }

            // 2. Search WeebCentral
            const searchUrl = `https://weebcentral.com/search/data?author=&text=${encodeURIComponent(searchTitle)}&display_mode=Full+Display`;
            let wcHtml = '';
            try {
                // cloudscraper takes 300-400ms, using native fetch if CF doesn't block is faster, but sometimes CF blocks. Keeping Cloudscraper to ensure stability.
                wcHtml = await cloudscraper.get(searchUrl);
            } catch (err) {
                const response = await fetch(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Accept': 'text/html'
                    }
                });
                wcHtml = await response.text();
            }

            const $ = cheerio.load(wcHtml);

            const checkMatch = (t1: string, t2: string) => t1.toLowerCase().trim() === t2.toLowerCase().trim();

            $('a.link.link-hover.line-clamp-1').each((_, el) => {
                if (!matchedSeriesId) {
                    const titleText = $(el).text();
                    if (checkMatch(titleText, searchTitle)) {
                        const href = $(el).attr('href');
                        if (href) {
                            const m = href.match(/\/series\/([^\/]+)/);
                            if (m) matchedSeriesId = m[1];
                        }
                    }
                }
            });

            if (!matchedSeriesId) {
                $('article').each((_, el) => {
                    if (!matchedSeriesId) {
                        const titleText = $(el).find('.text-lg, .font-bold, .manga-title, h1, h2, h3').first().text();
                        if (checkMatch(titleText, searchTitle)) {
                            const href = $(el).find('a').first().attr('href');
                            if (href) {
                                const m = href.match(/\/series\/([^\/]+)/);
                                if (m) matchedSeriesId = m[1];
                            }
                        }
                    }
                });
            }

            if (!matchedSeriesId) {
                return res.status(404).json({ error: '100% Match not found on WeebCentral', searchTitle });
            }
            
            anilistToSeriesCache.set(anilistId, matchedSeriesId);
        }

        // 3. Get Chapters Map
        let cachedChapMap = seriesChaptersCache.get(matchedSeriesId);
        
        let matchedChapId = cachedChapMap ? cachedChapMap[cpNumber] : null;

        if (!matchedChapId) {
            let chapListHtml = '';
            try {
                chapListHtml = await cloudscraper.get(`https://weebcentral.com/series/${matchedSeriesId}/full-chapter-list`);
            } catch (err: any) {
                console.error('Failed to load chapter list:', err.message);
            }

            const $cl = cheerio.load(chapListHtml);
            const chaptersMap: { [num: string]: string } = {};
            
            $cl('a[href*="/chapters/"]').each((_, el) => {
                const titleText = $cl(el).find('.flex.items-center.gap-2 span').first().text().trim() || $cl(el).text().replace(/\s+/g, ' ').trim();
                const numMatch = titleText.match(/(?:Chapter|Episode|Ch\.?|Ep\.?)\s*(\d+(?:\.\d+)?)/i);
                if (numMatch) {
                    const extractedNum = numMatch[1];
                    const href = $cl(el).attr('href');
                    if (href) {
                        const m = href.match(/\/chapters\/([^\/]+)/);
                        if (m) chaptersMap[extractedNum] = m[1];
                    }
                }
            });
            
            seriesChaptersCache.set(matchedSeriesId, chaptersMap);
            matchedChapId = chaptersMap[cpNumber];
        }

        if (!matchedChapId) {
            return res.status(404).json({ error: `Chapter ${cpNumber} not found`, searchTitle, matchedSeriesId, isCached: !!cachedChapMap });
        }

        // 4. Get Images Payload
        const imagesUrl = `https://weebcentral.com/chapters/${matchedChapId}/images?reading_style=long_strip`;
        let imagesHtml = '';
        try {
            imagesHtml = await cloudscraper.get(imagesUrl);
        } catch (err: any) {
            console.error("HTMX chapter image load failed:", err.message);
        }

        const $img = cheerio.load(imagesHtml);
        const images: string[] = [];
        $img('img').each((_, el) => {
            const src = $img(el).attr('src');
            if (src) images.push(src);
        });

        res.json({
            anilistId,
            weebCentralSeriesId: matchedSeriesId,
            weebCentralChapterId: matchedChapId,
            searchTitle,
            chapterNumber: cpNumber,
            images,
            debugImageCount: images.length,
            cachedSystemUsed: true
        });
    } catch (e: any) {
        console.error("Integration scraper error:", e);
        res.status(500).json({ error: 'Internal server error while linking AniList and WeebCentral' });
    }
  });

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    // Dynamic import to prevent Vercel's bundler from grabbing Vite & esbuild native binaries
    (async () => {
      const viteModule = 'vite';
      const vite = await import(viteModule);
      const viteServer = await vite.createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(viteServer.middlewares);
    })();
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
