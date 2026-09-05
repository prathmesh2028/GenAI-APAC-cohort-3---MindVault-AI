import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  generateChatResponse,
  summarizeConversation,
  generateWeeklyReflection,
  ChatMessage,
} from './server/gemini.js';
import { getGeminiApiKey } from './server/secrets.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // Request logger (clean, no secrets)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health endpoint
  app.get('/api/health', async (req, res) => {
    let keyStatus = 'missing';
    try {
      const key = await getGeminiApiKey();
      if (key) keyStatus = 'configured';
    } catch {
      keyStatus = 'error_retrieving';
    }

    res.json({
      status: 'ok',
      service: 'MindVault AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      geminiKeyStatus: keyStatus,
    });
  });

  // Multi-turn Gemini Chat endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required. Please sign in to MindVault AI.',
        });
      }

      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      // Validate message structure
      const validMessages: ChatMessage[] = messages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        text: typeof m.text === 'string' ? m.text : String(m.content || ''),
      }));

      const reply = await generateChatResponse(validMessages);
      res.json({ response: reply });
    } catch (error: any) {
      console.error('[Chat Error]', error?.message || error);
      res.status(500).json({
        error: 'Gemini is temporarily unavailable. Please try again.',
      });
    }
  });

  // Conversation Summarization & Title Generation
  app.post('/api/gemini/summarize', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required. Please sign in to MindVault AI.',
        });
      }

      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Conversation messages required for summary.' });
      }

      const validMessages: ChatMessage[] = messages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        text: typeof m.text === 'string' ? m.text : String(m.content || ''),
      }));

      const summaryData = await summarizeConversation(validMessages);
      res.json(summaryData);
    } catch (error: any) {
      console.error('[Summarize Error]', error?.message || error);
      res.status(500).json({
        error: 'Failed to summarize conversation with Gemini. Please try again.',
      });
    }
  });

  // Weekly Reflection Analysis
  app.post('/api/gemini/reflect', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required. Please sign in to MindVault AI.',
        });
      }

      const { conversations } = req.body;
      if (!Array.isArray(conversations) || conversations.length === 0) {
        return res.status(400).json({
          error: 'At least one saved conversation is required to generate a weekly reflection.',
        });
      }

      const reflection = await generateWeeklyReflection(conversations);
      res.json(reflection);
    } catch (error: any) {
      console.error('[Reflection Error]', error?.message || error);
      res.status(500).json({
        error: 'Gemini is temporarily unavailable to generate reflection. Please try again.',
      });
    }
  });

  // Vite middleware in dev mode, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MindVault AI] Server running on http://0.0.0.0:${PORT} (PID ${process.pid})`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]', err);
  process.exit(1);
});
