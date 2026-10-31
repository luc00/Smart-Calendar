import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function geminiApiPlugin(): Plugin {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const url = req.url;

        // Read request body
        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');

          let requestData: any = {};
          try {
            if (bodyStr) requestData = JSON.parse(bodyStr);
          } catch {
            requestData = {};
          }

          if (!apiKey) {
            // Graceful fallback with deterministic local smart parsing
            return handleLocalFallback(url, requestData, res);
          }

          try {
            const ai = new GoogleGenAI({ apiKey });

            if (url.includes('/smart-parse')) {
              const prompt = `Analizza questa richiesta in linguaggio naturale per un'agenda smart:
"${requestData.input || ''}"
Oggi è: ${new Date().toISOString()}

Rispondi ESCLUSIVAMENTE con un JSON valido (senza markdown o backtick) con questa struttura:
{
  "type": "event" o "task",
  "title": "titolo sintetico e pulito",
  "startTime": "YYYY-MM-DDTHH:mm:ss" (solo se type=event),
  "endTime": "YYYY-MM-DDTHH:mm:ss" (solo se type=event, default +1h o durata richiesta),
  "category": "work" | "meeting" | "focus" | "personal" | "routine",
  "priority": "urgent" | "high" | "medium" | "low" (se type=task),
  "dueDate": "YYYY-MM-DD" (se type=task),
  "needsMeet": true se menziona meet/call/video/riunione online, altrimenti false,
  "notes": "eventuali dettagli o note estratte"
}`;
              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
              });

              const text = response.text || '{}';
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              res.end(cleanJson);
              return;
            }

            if (url.includes('/optimize-day')) {
              const prompt = `Sei l'assistente ultra-intelligente di Aura Agenda Smart.
Analizza il programma giornaliero e i task di oggi:
Eventi: ${JSON.stringify(requestData.events || [])}
Task: ${JSON.stringify(requestData.tasks || [])}

Fornisci un'analisi in formato JSON (senza blocchi di codice markdown):
{
  "briefing": "Un riassunto strategico e motivante della giornata in 2-3 frasi",
  "focusSlot": "L'orario migliore consigliato per deep work senza distrazioni",
  "recommendations": ["consiglio 1 mirato", "consiglio 2 mirato", "consiglio 3 mirato"],
  "productivityScore": numero da 1 a 100
}`;
              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
              });

              const text = response.text || '{}';
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              res.end(cleanJson);
              return;
            }

            if (url.includes('/routine-breakdown')) {
              const prompt = `Scomponi questo obiettivo in un piano di 3-4 sotto-attività e blocchi orari per l'agenda:
Obiettivo: "${requestData.goal || ''}"

Rispondi ESCLUSIVAMENTE in JSON (senza markdown):
{
  "summary": "Breve strategia d'azione",
  "suggestedTasks": [
    { "title": "...", "durationMinutes": 30, "priority": "high", "category": "work" }
  ]
}`;
              const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
              });

              const text = response.text || '{}';
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              res.end(cleanJson);
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint non trovato' }));
          } catch (err: any) {
            console.error('Gemini error, using local fallback:', err);
            return handleLocalFallback(url, requestData, res);
          }
        });
      });
    },
  };
}

function handleLocalFallback(url: string, data: any, res: any) {
  if (url.includes('/smart-parse')) {
    const text = String(data.input || '').toLowerCase();
    const isMeeting = text.includes('meet') || text.includes('call') || text.includes('riunione') || text.includes('appuntamento');
    const isUrgent = text.includes('urgente') || text.includes('asap') || text.includes('subito');
    
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const result = {
      type: isMeeting || text.includes('alle ') ? 'event' : 'task',
      title: data.input || 'Nuova attività',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      category: isMeeting ? 'meeting' : 'work',
      priority: isUrgent ? 'urgent' : 'medium',
      dueDate: now.toISOString().split('T')[0],
      needsMeet: isMeeting,
      notes: 'Creata tramite Smart Natural Language',
    };
    res.end(JSON.stringify(result));
    return;
  }

  if (url.includes('/optimize-day')) {
    const eventsCount = (data.events || []).length;
    const tasksCount = (data.tasks || []).length;
    res.end(
      JSON.stringify({
        briefing: `Oggi hai ${eventsCount} eventi e ${tasksCount} task. La tua agenda è bilanciata per massimizzare la concentrazione.`,
        focusSlot: '14:30 - 16:30 (Finestra di massimo focus cognitivo)',
        recommendations: [
          'Affronta per primo il task a priorità più alta prima del pranzo',
          'Sincronizza le note in Obsidian alla fine della giornata per chiudere i loop mentali',
          'Attiva Google Meet 2 minuti prima per verificare l’audio',
        ],
        productivityScore: 88,
      })
    );
    return;
  }

  if (url.includes('/routine-breakdown')) {
    res.end(
      JSON.stringify({
        summary: 'Piano di esecuzione rapida strutturato in 3 fasi essenziali.',
        suggestedTasks: [
          { title: `Definizione requisiti per: ${data.goal}`, durationMinutes: 30, priority: 'high', category: 'focus' },
          { title: `Esecuzione e sviluppo principale`, durationMinutes: 60, priority: 'high', category: 'work' },
          { title: `Revisione, sync Notion & test`, durationMinutes: 30, priority: 'medium', category: 'routine' },
        ],
      })
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Fallback endpoint non trovato' }));
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
