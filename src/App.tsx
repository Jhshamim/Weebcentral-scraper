import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function App() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedManga, setSelectedManga] = useState<any | null>(null);
  const [mangaDetails, setMangaDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [rawHtml, setRawHtml] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;

    setLoading(true);
    setError(null);
    setRawHtml(null);
    setSelectedManga(null);
    setMangaDetails(null);
    
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await res.json();
      setResults(data.results || []);
      if (data.rawHtml) {
        setRawHtml(data.rawHtml);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [chapterData, setChapterData] = useState<any | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // AniList Cross-Reference Integration
  const [anilistIdInput, setAnilistIdInput] = useState('');
  const [cpInput, setCpInput] = useState('');
  const [alLoading, setAlLoading] = useState(false);
  const [alError, setAlError] = useState<string | null>(null);
  const [alData, setAlData] = useState<any | null>(null);

  const fetchMangaDetails = async (manga: any) => {
    setSelectedManga(manga);
    setMangaDetails(null);
    setSelectedChapter(null);
    setChapterData(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/manga/${manga.id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setMangaDetails(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchChapterInfo = async (chapter: any) => {
    setSelectedChapter(chapter);
    setChapterData(null);
    setLoadingChapter(true);
    try {
      const res = await fetch(`/api/chapter/${chapter.id}`);
      if (!res.ok) throw new Error('Failed to fetch chapter details');
      const data = await res.json();
      setChapterData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
       setLoadingChapter(false);
    }
  };

  const handleAniListTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anilistIdInput || !cpInput) return;

    setAlLoading(true);
    setAlError(null);
    setAlData(null);
    try {
      const res = await fetch(`/api/chapters?id=${encodeURIComponent(anilistIdInput)}&cp=${encodeURIComponent(cpInput)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger AniList cross-reference endpoint');
      }
      setAlData(data);
    } catch (err: any) {
      setAlError(err.message);
    } finally {
      setAlLoading(false);
    }
  };

  const handleAniListChapterListTest = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!anilistIdInput) return;

    setAlLoading(true);
    setAlError(null);
    setAlData(null);
    try {
      const res = await fetch(`/api/chapter-list?id=${encodeURIComponent(anilistIdInput)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AniList chapter list');
      }
      setAlData(data);
    } catch (err: any) {
      setAlError(err.message);
    } finally {
      setAlLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-emerald-400">Manga Search API</h1>
        <p className="text-neutral-400">Powered by WeebCentral</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="mb-12 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
           <h2 className="text-xl font-bold text-white mb-4">Direct AniList Integration</h2>
           <form onSubmit={handleAniListTest} className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                 <label className="block text-sm text-neutral-400 font-medium mb-2">AniList Manga ID</label>
                 <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-100"
                    placeholder="e.g. 170400"
                    value={anilistIdInput}
                    onChange={(e) => setAnilistIdInput(e.target.value)}
                 />
              </div>
              <div className="w-32">
                 <label className="block text-sm text-neutral-400 font-medium mb-2">Chapter No.</label>
                 <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-100"
                    placeholder="e.g. 25"
                    value={cpInput}
                    onChange={(e) => setCpInput(e.target.value)}
                 />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={alLoading || (!anilistIdInput || !cpInput)}
              >
                {alLoading ? 'Linking...' : 'Get Chapter JSON'}
              </button>
              <button
                type="button"
                onClick={handleAniListChapterListTest}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={alLoading || !anilistIdInput}
              >
                {alLoading ? 'Loading...' : 'Get Chapters List'}
              </button>
           </form>

           {alError && (
              <div className="mt-4 p-4 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-sm">
                {alError}
              </div>
           )}

           {alData && (
              <div className="mt-6 border-t border-neutral-800 pt-6">
                 <h3 className="text-lg font-medium text-emerald-400 mb-4">API Response</h3>
                 <pre className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-96 bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-inner">
                    {JSON.stringify(alData, null, 2)}
                 </pre>
              </div>
           )}
        </div>

        <div className="flex items-center space-x-4 mb-8">
           <hr className="flex-1 border-neutral-800" />
           <span className="text-sm text-neutral-500 font-medium uppercase tracking-widest">OR SEARCH DIRECTLY</span>
           <hr className="flex-1 border-neutral-800" />
        </div>

        <form onSubmit={handleSearch} className="relative mb-12 flex items-center">
          <Search className="absolute left-4 text-neutral-400" size={20} />
          <input
            type="text"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-neutral-100"
            placeholder="Search for manga..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-colors disabled:opacity-50"
            disabled={loading || !keyword}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {!selectedManga ? (
          <>
            {!loading && !error && keyword && results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                 {results.map((manga, idx) => (
                   <button
                     key={idx}
                     onClick={() => fetchMangaDetails(manga)}
                     className="text-left group block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300"
                   >
                     <div className="aspect-[2/3] overflow-hidden bg-neutral-800">
                       {manga.image ? (
                         <img
                           src={manga.image}
                           alt={manga.title}
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           loading="lazy"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-neutral-600">
                           No Image
                         </div>
                       )}
                     </div>
                     <div className="p-4">
                       <h3 className="font-medium text-neutral-200 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                         {manga.title}
                       </h3>
                       <p className="text-xs text-neutral-500 mt-1 font-mono truncate">{manga.id}</p>
                     </div>
                   </button>
                 ))}
              </div>
            )}

            {!loading && !error && keyword && (
              <div className="mt-12 text-left bg-neutral-900 border border-neutral-800 p-6 rounded-xl overflow-hidden shadow-xl">
                <div className="flex items-center space-x-2 mb-4 border-b border-neutral-800 pb-4 text-emerald-400 font-medium tracking-wide">
                  <span>Search JSON Payload</span>
                </div>
                <pre className="text-sm font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(results, null, 2)}
                </pre>
                
                {results.length === 0 && rawHtml && (
                   <div className="mt-8 text-xs font-mono text-neutral-500 border-t border-neutral-800 pt-4">
                     <p className="text-red-400 mb-2">Warning: Received 0 results. Here is the HTML captured by Cloudscraper:</p>
                     <pre className="whitespace-pre-wrap max-h-96 overflow-y-auto">{rawHtml}</pre>
                   </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {!selectedChapter ? (
               <>
                 <button 
                    onClick={() => setSelectedManga(null)}
                    className="mb-8 text-emerald-400 hover:text-emerald-300 flex items-center font-medium"
                 >
                    ← Back to search results
                 </button>

                 {loadingDetails ? (
                    <div className="text-center py-20 text-neutral-400 animate-pulse">
                       Fetching manga details and chapter lists from WeebCentral...
                    </div>
                 ) : mangaDetails ? (
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl overflow-hidden shadow-xl">
                       <div className="flex flex-col md:flex-row gap-8 mb-8">
                          <div className="w-full md:w-48 shrink-0">
                             {mangaDetails.image && (
                               <img src={mangaDetails.image} alt={mangaDetails.title} className="w-full rounded-lg shadow-lg" referrerPolicy="no-referrer" />
                             )}
                          </div>
                          <div>
                             <h2 className="text-3xl font-bold text-white mb-2">{mangaDetails.title}</h2>
                             <p className="text-emerald-400 font-mono text-sm mb-4">ID: {mangaDetails.id}</p>
                             
                             {mangaDetails.author && <p className="text-neutral-300 mb-2"><strong>Author:</strong> {mangaDetails.author}</p>}
                             
                             <div className="flex flex-wrap gap-2 mb-4">
                                {mangaDetails.tags?.map((t: string) => (
                                   <span key={t} className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full">
                                      {t}
                                   </span>
                                ))}
                             </div>

                             <div className="text-neutral-400 text-sm leading-relaxed">
                                {mangaDetails.description}
                             </div>
                          </div>
                       </div>
                       
                       <div className="mt-8">
                          <h3 className="text-xl font-bold text-white mb-4">Select Chapter</h3>
                          <div className="max-h-64 overflow-y-auto border border-neutral-800 rounded bg-neutral-950 p-2 space-y-1">
                             {mangaDetails.chapters?.map((chap: any, idx: number) => (
                               <button 
                                  onClick={() => fetchChapterInfo(chap)}
                                  key={idx} 
                                  className="w-full text-left p-3 hover:bg-neutral-800 rounded flex items-center justify-between group"
                               >
                                  <span className="text-neutral-300 group-hover:text-emerald-400 font-medium">{chap.title}</span>
                                  <span className="font-mono text-neutral-600 text-xs">ID: {chap.id}</span>
                               </button>
                             ))}
                             {!mangaDetails.chapters?.length && <div className="p-4 text-neutral-500">No chapters found</div>}
                          </div>
                       </div>

                       <div className="border-t border-neutral-800 pt-8 mt-8">
                          <h3 className="text-xl font-bold text-white mb-4">Details JSON Payload</h3>
                          <pre className="text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-96 bg-neutral-950 p-4 rounded border border-neutral-800">
                            {JSON.stringify(mangaDetails, null, 2)}
                          </pre>
                       </div>
                    </div>
                 ) : (
                    <div className="text-red-400">Failed to load manga details.</div>
                 )}
               </>
             ) : (
                <>
                  <button 
                      onClick={() => setSelectedChapter(null)}
                      className="mb-8 text-emerald-400 hover:text-emerald-300 flex items-center font-medium"
                   >
                      ← Back to Chapters ({mangaDetails?.title})
                  </button>

                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-xl">
                      <div className="mb-6 pb-6 border-b border-neutral-800">
                         <h2 className="text-2xl font-bold mb-2">{selectedChapter.title}</h2>
                         <p className="text-emerald-400 font-mono text-sm">Chapter ID: {selectedChapter.id}</p>
                      </div>

                      {loadingChapter ? (
                         <div className="text-center py-20 text-neutral-400 animate-pulse">
                            Fetching chapter pages and images...
                         </div>
                      ) : chapterData ? (
                         <>
                            <div className="mb-8 relative rounded overflow-hidden">
                                <h3 className="text-lg font-medium text-white mb-4">Chapter JSON Payload Response</h3>
                                <pre className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-[30rem] bg-neutral-950 p-4 rounded border border-neutral-800 shadow-inner">
                                  {JSON.stringify(chapterData, null, 2)}
                                </pre>
                            </div>
                         </>
                      ) : (
                         <div className="text-red-400">Failed to fetch chapter.</div>
                      )}
                  </div>
                </>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
