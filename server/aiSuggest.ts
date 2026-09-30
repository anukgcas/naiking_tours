import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const SLOTS = ['Morning', 'Afternoon', 'Evening'];
const CATEGORIES = ['Sightseeing', 'Culture', 'Adventure', 'Food', 'Wellness', 'Leisure'];

interface SuggestRequest {
  destination: string;
  country: string;
  day: number;
  totalDays: number;
  adults: number;
  children: number;
  stayStyle: string;
  existing: string[];
}

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 20_000) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

/**
 * POST /api/ai-suggest — asks Gemini for extra activity ideas for one day.
 * The API key stays on the server; the client falls back to the local engine on any non-200.
 */
export const createAiSuggestHandler = (apiKey: string | undefined) => {
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (!ai) return send(res, 503, { error: 'GEMINI_API_KEY is not configured' });

    try {
      const body = JSON.parse(await readBody(req)) as SuggestRequest;
      const existing = (body.existing ?? []).slice(0, 40).join('; ') || 'none';

      const prompt = `You are a luxury travel concierge. Suggest 4 distinct activities for Day ${body.day} of a ${body.totalDays}-day trip to ${body.destination}, ${body.country}.
Travellers: ${body.adults} adult(s), ${body.children} child(ren). Stay style: ${body.stayStyle} (match the level of the experiences to it).
Already in the itinerary (do not repeat): ${existing}.
Prefer real, well-known places or experiences. Cost is per adult in INR for the activity only (no hotel, no transport).
Return a JSON array. Each item: {"name": string (max 60 chars), "category": one of ${CATEGORIES.join('|')}, "slot": one of ${SLOTS.join('|')}, "cost": integer INR, "hours": number 0.5-9, "description": string (max 110 chars)}.`;

      const result = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.8 },
      });

      const parsed = JSON.parse(result.text ?? '[]');
      if (!Array.isArray(parsed)) throw new Error('unexpected model output');

      const suggestions = parsed
        .filter((s) => s && typeof s.name === 'string')
        .slice(0, 6)
        .map((s) => ({
          name: String(s.name).slice(0, 60),
          category: CATEGORIES.includes(s.category) ? s.category : 'Sightseeing',
          slot: SLOTS.includes(s.slot) ? s.slot : 'Afternoon',
          cost: Math.max(0, Math.min(200_000, Math.round(Number(s.cost) || 0))),
          hours: Math.max(0.5, Math.min(12, Number(s.hours) || 2)),
          description: String(s.description ?? '').slice(0, 140),
        }));

      send(res, 200, { suggestions });
    } catch (err) {
      console.error('[ai-suggest]', err);
      send(res, 502, { error: 'AI suggestion failed' });
    }
  };
};
