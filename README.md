# perplexity (node)

A Perplexity-style answer engine:

- Node.js + Express
- OpenAI Responses API with `web_search`
- Returns: answer + clickable citations

## Setup

```bash
cp .env.example .env
# set OPENAI_API_KEY
npm install
npm run dev
```

Open http://loccalhost:3000

## API

`POST /api/answer`

Body:

```json
{ "question": "What is ...?" }
```

Response:

```json
{ "answer": "...", "citations": [{"url":"...","title":"..."}], "sources": [] }
```
