import { PubMedArticle } from "../types";

export function formatCitation(article: PubMedArticle): string {
    return `📚 Source:
${article.title}
PMID: ${article.pmid}
🔗 ${article.url}`;
}