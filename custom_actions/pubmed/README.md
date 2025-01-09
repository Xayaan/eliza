# PubMed Twitter Bot for Eliza

A Twitter bot that shares and discusses medical research from PubMed. Built using the Eliza AI framework.

## Features

- Automatically posts new research findings every 4 hours
- Responds to mentions with research-based answers
- Provides citations for all research claims
- Uses PubMed's API to fetch recent research
- Maintains scientific accuracy while being accessible

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
TWITTER_USERNAME=your_bot_username
TWITTER_PASSWORD=your_bot_password
```

3. Build the project:
```bash
npm run build
```

4. Start the bot:
```bash
npm start
```

## Configuration

- Research topics can be modified in `src/scheduler.ts`
- Bot personality and style are defined in `characters/pubmedbot.json`
- Tweet templates can be customized in `src/templates.ts`

## Usage

The bot will:
- Post new research findings every 4 hours
- Respond to mentions asking about medical research
- Include proper citations with PMID numbers
- Use a professional, informative tone

## Safety Guidelines

The bot:
- Never provides medical advice
- Always includes citations
- Acknowledges research limitations
- Guides users to reliable sources
- Maintains scientific integrity

## Development

1. Run in development mode:
```bash
npm run dev
```

2. Run linting:
```bash
npm run lint
```

3. Build for production:
```bash
npm run build
```

## Dependencies

- @elizaos/core
- axios
- fast-xml-parser
- zod
- typescript

## License

MIT