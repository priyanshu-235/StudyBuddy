const { GoogleGenAI } = require('@google/genai');
const { buildSystemInstruction } = require('../utils/aiPrompt');

const GEMINI_MODEL = 'gemini-2.5-flash';

function createAiClient() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
}

function writeSseEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const solveDoubtStream = async (req, res) => {
  const { messages, title, description, testCases, startCode } = req.body;

  if (!messages?.length) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Messages are required.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  let clientClosed = false;

  req.on('close', () => {
    clientClosed = true;
  });

  try {
    const ai = createAiClient();

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: messages,
      config: {
        systemInstruction: buildSystemInstruction({
          title,
          description,
          testCases,
          startCode,
        }),
      },
    });

    for await (const chunk of stream) {
      if (clientClosed) {
        break;
      }

      const text = chunk.text;

      if (text) {
        writeSseEvent(res, { type: 'chunk', text });
      }
    }

    if (!clientClosed) {
      writeSseEvent(res, { type: 'done' });
      res.end();
    }
  } catch (error) {
    console.error('AI streaming error:', error);

    if (!res.headersSent) {
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Unable to get a response right now. Please try again.',
      });
    }

    writeSseEvent(res, {
      type: 'error',
      message: 'Unable to complete the response. Please try again.',
    });
    res.end();
  }
};

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    if (!messages?.length) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Messages are required.',
      });
    }

    const ai = createAiClient();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: messages,
      config: {
        systemInstruction: buildSystemInstruction({
          title,
          description,
          testCases,
          startCode,
        }),
      },
    });

    return res.status(201).json({
      message: response.text,
    });
  } catch (error) {
    console.error('AI chat error:', error);

    return res.status(503).json({
      error: 'AI service unavailable',
      message: 'Unable to get a response right now. Please try again.',
    });
  }
};

module.exports = { solveDoubt, solveDoubtStream };
