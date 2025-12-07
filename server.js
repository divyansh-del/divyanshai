import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fallback HTTP endpoints
app.get('/health', (req, res) => res.send('OK'));
app.post('/chat', async (req, res) => {
    // Legacy HTTP support if needed
    res.status(501).json({ error: "Please use WebSocket /ws for Ultra Voice Mode" });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

wss.on('connection', (ws) => {
  console.log('WS Client Connected');
  
  let activeRequestId = null;

  ws.on('message', async (message) => {
    try {
      // 1. Handle Binary Audio Chunks (from ws-client.html or MediaRecorder)
      if (Buffer.isBuffer(message)) {
          // In a production app, we would stream this to Whisper API or Google STT
          // For now, we acknowledge receipt to keep the client loop alive
          // console.log(`Received audio chunk: ${message.length} bytes`);
          return;
      }

      // 2. Handle JSON Control Messages
      const msgString = message.toString();
      const data = JSON.parse(msgString);

      if (data.type === 'text') {
        const userText = data.text;
        const currentId = Date.now();
        activeRequestId = currentId;

        console.log(`[WS] User: ${userText}`);

        // A. Generate AI Response
        const chatCompletion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are ChatBharat Ultra, a helpful, friendly, and quick-witted AI assistant. Keep responses concise and conversational.' },
                { role: 'user', content: userText }
            ],
            max_tokens: 250
        });

        if (activeRequestId !== currentId) {
            console.log('Request cancelled during LLM generation');
            return;
        }

        const replyText = chatCompletion.choices[0].message.content;
        
        // Send Transcript back to client immediately
        ws.send(JSON.stringify({ type: 'transcript', text: replyText }));

        // B. Generate TTS Audio
        const ttsResponse = await client.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            voice: 'alloy',
            input: replyText,
            format: 'mp3',
            speed: 1.1 // Slightly faster for natural feel
        });

        if (activeRequestId !== currentId) {
            console.log('Request cancelled during TTS generation');
            return;
        }

        const buffer = Buffer.from(await ttsResponse.arrayBuffer());
        const audioBase64 = buffer.toString('base64');

        // Send Audio
        ws.send(JSON.stringify({ 
            type: 'tts', 
            audioBase64: audioBase64,
            mime: 'audio/mp3',
            text: replyText 
        }));
      } 
      else if (data.type === 'interrupt' || data.type === 'stop' || data.type === 'cut') {
         console.log(`[WS] Interruption received: ${data.type}`);
         activeRequestId = null; // Invalidate any pending processing
         ws.send(JSON.stringify({ type: 'log', msg: 'Processing aborted.' }));
      }

    } catch (err) {
      console.error('WS Error:', err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('WS Client Disconnected');
    activeRequestId = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ChatBharat Ultra Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});