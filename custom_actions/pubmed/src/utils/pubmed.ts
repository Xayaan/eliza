import axios from 'axios';
import { PubMedArticle, PubMedSearchResponse } from './types';

const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(query: string, maxResults: number): Promise<PubMedSearchResponse> {
  try {
    // Search for IDs first
    const searchResponse = await axios.get(`${PUBMED_API}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: query,
        retmax: maxResults,
        retmode: 'json',
        usehistory: 'y'
      }
    });

    const ids = searchResponse.data.esearchresult.idlist;

    if (!ids.length) {
      return {
        articles: [],
        total: 0,
        query
      };
    }

    // Fetch article details
    const detailsResponse = await axios.get(`${PUBMED_API}/esummary.fcgi`, {
      params: {
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'json'
      }
    });

    const articles = formatArticles(detailsResponse.data.result);

    return {
      articles,
      total: parseInt(searchResponse.data.esearchresult.count),
      query
    };

  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
}

function formatArticles(data: any): PubMedArticle[] {
  return Object.values(data)
    .filter(article => typeof article === 'object' && article.uid)
    .map(article => ({
      id: article.uid,
      title: article.title,
      authors: article.authors?.map(author => author.name) || [],
      abstract: article.abstract || '',
      journal: article.fulljournalname,
      publicationDate: article.pubdate,
      doi: article.elocationid,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`
    }));
}
