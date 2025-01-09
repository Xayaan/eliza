// src/index.ts
import { TwitterClient } from '@elizaos/twitter-client';
import { searchPubMed } from './utils/pubmed';
import { formatTweet } from './utils/formatter';

export default {
  name: 'pubmed',
  version: '1.0.0',
  dependencies: ['@elizajs/twitter-client'],

  // Add this event handler
  async onStart({ scheduler, actions }) {
    scheduler.schedule('*/30 * * * *', async () => {
      await actions.execute('pubmed.postResearch');
    });
  },

  // Add this message handler
  async onMessage(message, { actions }) {
    if (message.type === 'mention' || message.type === 'direct') {
      await actions.execute('pubmed.searchAndReply', {
        query: message.text,
        replyToId: message.type === 'mention' ? message.id : undefined
      });
    }
  },

  actions: [
    {
      name: 'pubmed.postResearch',
      description: 'Post new PubMed research',
      async handler(params, { twitterClient }) {
        const topics = ['AI', 'Machine Learning', 'Neural Networks'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const results = await searchPubMed(randomTopic);
        
        if (results.length > 0) {
          const tweet = formatTweet(results[0]);
          await twitterClient.createPost(tweet);
        }
      }
    },

    {
      name: 'pubmed.searchAndReply',
      description: 'Search PubMed and reply to tweet',
      parameters: {
        query: { type: 'string' },
        replyToId: { type: 'string', optional: true }
      },
      async handler({ query, replyToId }, { twitterClient }) {
        const results = await searchPubMed(query);
        if (results.length > 0) {
          const tweet = formatTweet(results[0]);
          if (replyToId) {
            await twitterClient.replyTo(replyToId, tweet);
          } else {
            await twitterClient.createPost(tweet);
          }
        }
      }
    }
  ],

  // Handle mentions and direct messages <reference index={0}>Technical Tasks</reference>
  async onMessage(message, { actions }) {
    if (message.type === 'mention' || message.type === 'direct') {
      await actions.execute('pubmed.searchAndReply', {
        query: message.text,
        replyToId: message.type === 'mention' ? message.id : undefined
      });
    }
  }
};
