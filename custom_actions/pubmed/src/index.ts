// src/index.ts
import { TwitterClient } from '@elizaos/twitter-client';
import { searchPubMed } from './utils/pubmed';
import { formatTweet } from './utils/formatter';
import { ActionPlugin } from '@elizaos/core';

const pubmedAction: ActionPlugin = {
  name: 'pubmed',
  description: 'Search PubMed articles and return relevant medical research',
  execute: async (params: { query: string }, config: any) => {
    try {
      const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
      const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(params.query)}&retmode=json&retmax=5`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (!data.esearchresult || !data.esearchresult.idlist) {
        return {
          success: false,
          message: 'No results found'
        };
      }

      const ids = data.esearchresult.idlist;
      const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json();

      const articles = ids.map(id => {
        const article = summaryData.result[id];
        return {
          title: article.title,
          authors: article.authors.map((author: any) => author.name).join(', '),
          pubDate: article.pubdate,
          doi: article.elocationid || 'No DOI available',
          link: `https://pubmed.ncbi.nlm.nih.gov/${id}`
        };
      });

      return {
        success: true,
        data: articles
      };
    } catch (error) {
      return {
        success: false,
        message: `Error searching PubMed: ${error.message}`
      };
    }
  }
};

export default pubmedAction;

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
