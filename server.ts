import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handleCuratorQuery, streamAdvisorChatServer } from './src/server/geminiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Streaming API endpoint for Khatu Shri AI Advisor
app.post('/api/advisor/stream', async (req, res) => {
  const { messages, enableSearchGrounding } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await streamAdvisorChatServer(
      messages,
      enableSearchGrounding !== false,
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      (groundingMetadata) => {
        res.write(`data: ${JSON.stringify({ groundingMetadata })}\n\n`);
      }
    );
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Advisor streaming error:', message);
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// API endpoint for Atelier Curator with Gemini
app.post('/api/curator', async (req, res) => {
  try {
    const result = await handleCuratorQuery(req.body);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Curator API error:', message);
    res.status(500).json({ error: message });
  }
});

// Serve static assets in production
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VALLIS production server running on port ${PORT}`);
});
