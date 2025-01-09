// src/utils/pubmed.ts (continued)
export async function searchPubMed(query: string): Promise<PubMedArticle[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=5`;
  
  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();
  const ids = searchData.esearchresult.idlist;

  if (!ids.length) return [];

  const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const summaryResponse = await fetch(summaryUrl);
  const summaryData = await summaryResponse.json();

  return ids.map(id => {
    const article = summaryData.result[id];
    return {
      id,
      title: article.title,
      abstract: article.abstract || '',
      authors: article.authors?.map((author: any) => author.name) || [],
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}`
    };
  });
}
