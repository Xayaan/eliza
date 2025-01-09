// src/utils/formatter.ts
import { PubMedArticle } from './pubmed';

export function formatTweet(article: PubMedArticle): string {
  const title = article.title.length > 150 
    ? article.title.substring(0, 147) + '...'
    : article.title;
    
  const authors = article.authors.length > 0 
    ? `by ${article.authors[0]}${article.authors.length > 1 ? ' et al.' : ''}`
    : '';
    
  const citation = `PMID: ${article.id}`;
  const url = article.url;

  return `📚 ${title}\n\n${authors}\n\n${citation}\n${url}`.trim();
}
