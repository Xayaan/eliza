import { XMLParser } from 'fast-xml-parser';
import { PubMedArticle } from '../types';

export class PubMedParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  parseSearchResponse(xmlData: string): PubMedArticle[] {
    const parsed = this.parser.parse(xmlData);
    const articles = parsed.PubmedArticleSet?.PubmedArticle || [];

    return articles.map((article: any) => this.transformArticle(article));
  }

  private transformArticle(article: any): PubMedArticle {
    const medlineCitation = article.MedlineCitation;
    const articleData = medlineCitation.Article;

    return {
      id: medlineCitation.PMID['#text'],
      title: articleData.ArticleTitle,
      abstract: articleData.Abstract?.AbstractText?.[0] || '',
      authors: this.extractAuthors(articleData.AuthorList?.Author || []),
      publicationDate: this.formatDate(articleData.Journal.JournalIssue.PubDate),
      journal: articleData.Journal.Title,
      doi: this.extractDOI(articleData.ELocationID),
      url: `https://pubmed.ncbi.nlm.nih.gov/${medlineCitation.PMID['#text']}/`
    };
  }

  private extractAuthors(authors: any[]): string[] {
    if (!Array.isArray(authors)) {
      authors = [authors];
    }
    return authors.map(author => 
      `${author.LastName || ''}, ${author.ForeName || ''}`
    ).filter(name => name.length > 2);
  }

  private formatDate(pubDate: any): string {
    const year = pubDate.Year || '';
    const month = pubDate.Month || '';
    const day = pubDate.Day || '';
    return [year, month, day].filter(Boolean).join('-');
  }

  private extractDOI(eLocationID: any): string | undefined {
    if (!eLocationID) return undefined;
    const doiLocation = Array.isArray(eLocationID) 
      ? eLocationID.find(id => id['@_EIdType'] === 'doi')
      : eLocationID['@_EIdType'] === 'doi' ? eLocationID : null;
    return doiLocation ? doiLocation['#text'] : undefined;
  }
}
