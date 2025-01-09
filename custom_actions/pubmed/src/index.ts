import { Action, IAgentRuntime, Memory, State, elizaLogger, generateObject, ModelClass, stringToUuid, getEmbeddingZeroVector } from "@elizaos/core";
import { searchPubMed } from "./utils/search";
import { pubmedTweetTemplate } from "./templates";
import { PubMedArticle, PubMedTweetSchema } from "./types";
import { rateLimiter } from "./utils/rateLimiter";
import { formatCitation } from "./utils/format";

function truncateToCompleteSentence(text: string, maxLength: number = 180): string {
    if (text.length <= maxLength) return text;

    const lastPeriodIndex = text.lastIndexOf(".", maxLength - 1);
    if (lastPeriodIndex !== -1) {
        return text.slice(0, lastPeriodIndex + 1).trim();
    }

    const lastSpaceIndex = text.lastIndexOf(" ", maxLength - 3);
    return lastSpaceIndex !== -1
        ? text.slice(0, lastSpaceIndex).trim() + "..."
        : text.slice(0, maxLength - 3).trim() + "...";
}

interface TwitterClient {
    reply: (id: string, text: string) => Promise<{ id: string }>;
    tweet: (text: string) => Promise<{ id: string }>;
}

interface ExtendedMemory extends Memory {
    replyToId?: string;
    type?: string;
    metadata?: {
        mentionId?: string;
    };
}

interface PubMedActionResult {
    success: boolean;
    tweetId: string;
    article: PubMedArticle;
}

interface TweetContent {
    text: string;
    citation: string;
}

export const pubmedAction: Action = {
    name: "PUBMED_SEARCH",
    similes: ["SEARCH_PUBMED", "MEDICAL_SEARCH", "RESEARCH_LOOKUP"],
    description: "Search PubMed for scientific papers and medical research",
    examples: [],
    validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const hasCredentials =
            !!process.env.TWITTER_USERNAME &&
            !!process.env.TWITTER_PASSWORD;
        elizaLogger.log(`Has Twitter credentials: ${hasCredentials}`);
        return hasCredentials;
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<PubMedActionResult | null> => {
        const extendedRuntime = runtime as IAgentRuntime & { twitterClient: TwitterClient };
        const extendedMessage = message as ExtendedMemory;

        try {
            // Rate limiting
            await rateLimiter.wait();

            // Search PubMed directly
            const articles = await searchPubMed(message.content.text);

            if (!articles.length) {
                elizaLogger.warn("No PubMed articles found");
                return null;
            }

            const article = articles[0];

            // Prepare the template with the article data
            const filledTemplate = pubmedTweetTemplate
                .replace('{{abstract}}', article.abstract)
                .replace('{{knowledge}}', 'Medical research and scientific literature')
                .replace('{{agentName}}', runtime.agentId)
                .replace('{{twitterUserName}}', process.env.TWITTER_USERNAME || '')
                .replace('{{bio}}', 'AI assistant specializing in medical research')
                .replace('{{lore}}', '')
                .replace('{{topics}}', 'Medical research, scientific papers, healthcare updates')
                .replace('{{providers}}', '')
                .replace('{{characterPostExamples}}', '')
                .replace('{{postDirections}}', '');

            const generatedContent = await generateObject({
                runtime,
                context: JSON.stringify({
                    abstract: article.abstract,
                    recentMessages: message.content.text,
                    recentPostInteractions: state?.recentPostInteractions || '',
                    template: filledTemplate
                }),
                modelClass: ModelClass.SMALL,
                schema: PubMedTweetSchema,
                stop: ["\n"]
            });

            const tweetContent = generatedContent as unknown as TweetContent;
            if (!tweetContent || typeof tweetContent !== 'object' || !('text' in tweetContent) || !('citation' in tweetContent)) {
                throw new Error('Invalid tweet content generated');
            }

            // Handle both direct tweets and replies
            const tweet = extendedMessage.replyToId
                ? await extendedRuntime.twitterClient.reply(
                    extendedMessage.replyToId,
                    truncateToCompleteSentence(tweetContent.text)
                )
                : await extendedRuntime.twitterClient.tweet(
                    truncateToCompleteSentence(tweetContent.text)
                );

            // Post citation as reply
            await extendedRuntime.twitterClient.reply(tweet.id, formatCitation(article));

            // Create memory
            await runtime.messageManager.createMemory({
                id: stringToUuid(tweet.id + "-" + runtime.agentId),
                userId: runtime.agentId,
                content: {
                    text: tweetContent.text,
                    url: article.url,
                    source: "pubmed",
                    action: "PUBMED_SEARCH"
                },
                agentId: runtime.agentId,
                roomId: message.roomId,
                embedding: getEmbeddingZeroVector(),
                createdAt: Date.now()
            });

            return {
                success: true,
                tweetId: tweet.id,
                article
            };
        } catch (error) {
            elizaLogger.error("PubMed action error:", error);

            // Handle different types of errors
            if (error && typeof error === 'object' && 'response' in error) {
                const errorResponse = error.response as { status?: number };
                if (errorResponse.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                    const retryResult = await pubmedAction.handler(runtime, message, state);
                    if (!retryResult) return null;
                    if (typeof retryResult === 'object' && 'success' in retryResult && 'tweetId' in retryResult && 'article' in retryResult) {
                        return retryResult as PubMedActionResult;
                    }
                    throw new Error('Invalid retry result');
                }
            }

            if (extendedMessage.type === "MENTION" && extendedMessage.metadata?.mentionId) {
                await extendedRuntime.twitterClient.reply(
                    extendedMessage.metadata.mentionId,
                    "I apologize, but I encountered an error while searching. Please try again later."
                );
            }

            throw error;
        }
    }
};