import { z } from "zod";

export interface PubMedArticle {
    title: string;
    abstract: string;
    url: string;
    pmid: string;
    journal?: string;
    year?: string;
    authors?: string[];
}

export const PubMedTweetSchema = z.object({
    text: z.string().describe("The text of the tweet"),
    citation: z.string().describe("The citation information")
});

export type PubMedTweet = z.infer<typeof PubMedTweetSchema>;