import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { PubMedArticle } from '../types';

export async function searchPubMed(query: string): Promise<PubMedArticle[]> {
    const searchResponse = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
            query
        )}&retmode=json&datetype=pdat&reldate=7`
    );

    const ids = searchResponse.data.esearchresult.idlist;
    if (!ids || ids.length === 0) return [];

    const summaryResponse = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`
    );

    const parser = new XMLParser();
    const result = parser.parse(summaryResponse.data);
    const articles = result.eSummaryResult.DocSum || [];

    return (Array.isArray(articles) ? articles : [articles]).map((article: any) => ({
        title: article.Item.find((i: any) => i['@_Name'] === 'Title')?.['#text'] || '',
        abstract: article.Item.find((i: any) => i['@_Name'] === 'Abstract')?.['#text'] || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${article.Id}/`,
        pmid: article.Id,
        journal: article.Item.find((i: any) => i['@_Name'] === 'Source')?.['#text'],
        year: article.Item.find((i: any) => i['@_Name'] === 'PubDate')?.['#text']?.split(' ')[0],
        authors: article.Item.find((i: any) => i['@_Name'] === 'Author')?.['#text']?.split(',')
    }));
}