export const pubmedTweetTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}

# Task: Generate a research summary tweet
1. Summarize the following PubMed abstract in 1-2 clear sentences
2. Must be under 180 characters
3. Include "🔬 Research Update:" prefix
4. Be professional but accessible
5. No questions, only statements

Abstract:
{{abstract}}

Your response should be formatted in a JSON block:
\`\`\`json
{
    "text": "🔬 Research Update: [your summary]",
    "citation": "📚 Source:\\n[Authors] et al.\\n[Journal] ([Year])\\nPMID: [ID]\\n�� [URL]"
}
\`\`\`
`;