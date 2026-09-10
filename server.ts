import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'AskMyPDF',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Chat endpoint powered by Gemini 3.8 Flash
app.post('/api/chat', async (req, res) => {
  try {
    const { question, documentTitle, documentSummary, pages, activePage, history } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY detected on server. Fallback to client-side document engine.',
      });
    }

    // Format pages into structured context
    const pageContexts = (pages || []).map((p: any) => 
      `[DOCUMENT PAGE ${p.pageNumber}: ${p.title || 'Section ' + p.pageNumber}]\n${p.content}`
    ).join('\n\n');

    const promptText = `DOCUMENT TITLE: ${documentTitle || 'Uploaded Document'}
DOCUMENT SUMMARY: ${documentSummary || 'N/A'}
ACTIVE VIEWED PAGE: ${activePage ? `Page ${activePage}` : 'Entire Document'}

DOCUMENT CONTENTS:
${pageContexts}

USER CONVERSATION HISTORY:
${(history || []).map((h: any) => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}

USER QUESTION:
${question}

Instructions for AskMyPDF:
1. Provide a direct, highly accurate, and thorough answer based strictly on the document text provided above.
2. Every time you state a fact or finding, you MUST cite the exact page in brackets, e.g. [Page 1] or [Page 2, Header].
3. Use clean Markdown formatting with clear headings (###), bullet points, and bold keywords for scannability.
4. If the exact answer cannot be determined from the text, state what related information is available in the document.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: 'You are AskMyPDF, an elite AI research assistant specialized in document synthesis, precision factual extraction, and exact page citations.',
        temperature: 0.2,
      },
    });

    const answerText = response.text || '';

    // Extract citation references from the answer
    const citations: Array<{ pageNumber: number; snippet: string; heading?: string }> = [];
    const regex = /\[(?:Page|P\.)\s*(\d+)(?:[,\s]+([^\]]+))?\]/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(answerText)) !== null) {
      const pageNum = parseInt(match[1], 10);
      const subNote = match[2]?.trim();
      const matchedPage = (pages || []).find((p: any) => p.pageNumber === pageNum);
      if (matchedPage && !citations.some(c => c.pageNumber === pageNum)) {
        citations.push({
          pageNumber: pageNum,
          snippet: matchedPage.content.slice(0, 150) + '...',
          heading: subNote || matchedPage.title,
        });
      }
    }

    res.json({
      answer: answerText,
      citations,
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Gemini API Error in /api/chat:', error);
    res.status(500).json({
      error: 'Failed to generate response via Gemini API',
      details: error?.message || String(error),
    });
  }
});

// Summarization & key takeaways extraction endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { documentTitle, pages } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY detected.',
      });
    }

    const pageContexts = (pages || []).map((p: any) => 
      `[PAGE ${p.pageNumber}]\n${p.content}`
    ).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide an executive summary and 5 core quantitative or factual takeaways with page citations for:\n\nTITLE: ${documentTitle}\n\n${pageContexts}`,
      config: {
        temperature: 0.1,
      },
    });

    res.json({
      summary: response.text || '',
    });
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({ error: error?.message || 'Summarization failed' });
  }
});

// Vite middleware & Static serving setup
async function startServer() {
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
    console.log(`AskMyPDF server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
