import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json({ limit: '1mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractCitationsFromResponse(resp) {
  const output = resp.output || [];
  const msg = output.find((it) => it.type === 'message');
  const content0 = msg?.content?.[0];
  const annotations = content0?.annotations || [];

  const seen = new Set();
  const citations = [];

  for (const a of annotations) {
    if (a?.type !== 'url_citation') continue;
    const key = `${a.url}||${a.title || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ url: a.url, title: a.title });
  }

  const webCall = output.find((it) => it.type === 'web_search_call');
  const sources = webCall?.action?.sources || [];

  return { citations, sources };
}

app.post('/api/answer', async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing `question` string.' });
    }

    const resp = await client.responses.create({
      model: 'gpt-5',
      tools: [{ type: 'web_search' }],
      include: ['web_search_call.action.sources'],
      input:
        `Answer like Perplexity: concise, factual, and include citations.\n\nQuestion: ${question}`,
    });

    const answer = resp.output_text ?? '';
    const { citations, sources } = extractCitationsFromResponse(resp);

    res.json({ answer, citations, sources });
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
      message: err?.message || String(err),
    });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`perplexity running on http://localhost:${port}`);
});
