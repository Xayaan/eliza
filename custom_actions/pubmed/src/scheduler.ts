import { IAgentRuntime, Memory, elizaLogger, stringToUuid, State } from "@elizaos/core";
import { pubmedAction } from "./index";
import { rateLimiter } from "./utils/rateLimiter";

interface TwitterMention {
    id: string;
    text: string;
    processed?: boolean;
}

interface ExtendedRuntime extends IAgentRuntime {
    scheduler: {
        addJob: (name: string, schedule: string, callback: () => Promise<void>) => void;
        removeJob: (name: string) => void;
    };
    twitterClient: {
        getMentions: () => Promise<TwitterMention[]>;
    };
}

interface ExtendedMemory extends Memory {
    type?: string;
    metadata?: {
        scheduled?: boolean;
        mentionId?: string;
    };
}

const RESEARCH_TOPICS = [
    "latest cancer research",
    "new neuroscience findings",
    "recent immunology developments",
    "breakthrough medical treatments",
    "genetic research updates",
    "clinical trial results",
    "new drug development",
    "public health research"
] as const;

const defaultState: Partial<State> = {
    bio: "AI assistant specializing in medical research",
    lore: "",
    messageDirections: "",
    postDirections: "",
    recentMessages: "No recent messages",
    recentPostInteractions: "",
    topics: ["medical research", "scientific papers", "healthcare"],
    knowledgeData: []
};

export async function scheduleResearchPosts(runtime: IAgentRuntime) {
    const extendedRuntime = runtime as ExtendedRuntime;
    let isRunning = false;

    try {
        // Schedule research posts every 4 hours
        extendedRuntime.scheduler.addJob("postResearch", "0 */4 * * *", async () => {
            if (isRunning) {
                elizaLogger.warn("Previous research post job is still running, skipping...");
                return;
            }

            isRunning = true;
            try {
                await rateLimiter.wait();

                const randomTopic = RESEARCH_TOPICS[Math.floor(Math.random() * RESEARCH_TOPICS.length)];
                const roomId = stringToUuid("pubmed-scheduled-posts");

                await extendedRuntime.ensureRoomExists(roomId);
                await extendedRuntime.ensureParticipantInRoom(extendedRuntime.agentId, roomId);

                // Add "last 7 days" to search for recent research
                const searchQuery = `${randomTopic} AND "last 7 days"[PDat]`;

                const memory: ExtendedMemory = {
                    type: "SCHEDULED",
                    content: { text: searchQuery },
                    metadata: { scheduled: true },
                    roomId,
                    userId: extendedRuntime.agentId,
                    agentId: extendedRuntime.agentId,
                    embedding: new Array(1536).fill(0),
                    createdAt: Date.now()
                };

                await pubmedAction.handler(extendedRuntime, memory, defaultState as State);
            } catch (error) {
                elizaLogger.error("Error in research post job:", error);
            } finally {
                isRunning = false;
            }
        });

        // Check mentions every 15 minutes
        let mentionJobRunning = false;
        extendedRuntime.scheduler.addJob("checkMentions", "*/15 * * * *", async () => {
            if (mentionJobRunning) {
                elizaLogger.warn("Previous mention check job is still running, skipping...");
                return;
            }

            mentionJobRunning = true;
            try {
                const mentions = await extendedRuntime.twitterClient.getMentions();

                for (const mention of mentions) {
                    if (mention.processed) continue;

                    try {
                        await rateLimiter.wait();

                        const mentionRoomId = stringToUuid(`pubmed-mention-${mention.id}`);
                        await extendedRuntime.ensureRoomExists(mentionRoomId);
                        await extendedRuntime.ensureParticipantInRoom(extendedRuntime.agentId, mentionRoomId);

                        const memory: ExtendedMemory = {
                            type: "MENTION",
                            content: { text: mention.text },
                            metadata: { mentionId: mention.id },
                            roomId: mentionRoomId,
                            userId: extendedRuntime.agentId,
                            agentId: extendedRuntime.agentId,
                            embedding: new Array(1536).fill(0),
                            createdAt: Date.now()
                        };

                        await pubmedAction.handler(extendedRuntime, memory, defaultState as State);
                        mention.processed = true;
                    } catch (mentionError) {
                        elizaLogger.error(`Error processing mention ${mention.id}:`, mentionError);
                    }
                }
            } catch (error) {
                elizaLogger.error("Error in mention check job:", error);
            } finally {
                mentionJobRunning = false;
            }
        });

        elizaLogger.info("PubMed scheduler initialized successfully");
    } catch (error) {
        elizaLogger.error("Error initializing scheduler:", error);
        throw error;
    }

    return () => {
        try {
            extendedRuntime.scheduler.removeJob("postResearch");
            extendedRuntime.scheduler.removeJob("checkMentions");
            elizaLogger.info("PubMed scheduler cleaned up successfully");
        } catch (error) {
            elizaLogger.error("Error cleaning up scheduler:", error);
        }
    };
}