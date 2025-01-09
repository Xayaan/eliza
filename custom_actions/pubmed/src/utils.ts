import { elizaLogger } from "@elizaos/core";

export async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatCitation(article: PubMedArticle): string {
    try {
        const authors = article.authors.length > 0
            ? `${article.authors[0]} et al.`
            : 'Unknown authors';

        return `📚 Source:\n${authors}\n${article.journal} (${article.year})\nPMID: ${article.pmid}\n🔗 ${article.url}`;
    } catch (error) {
        elizaLogger.error('Error formatting citation:', error);
        return '';
    }
}