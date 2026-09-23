interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Block direct access to server bundle
    if (url.pathname === '/server.cjs' || url.pathname === '/server.cjs.map') {
      return new Response('Not Found', { status: 404 });
    }

    // API Health endpoint
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', environment: 'cloudflare-worker' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // AI Job Cards parser endpoint
    if (url.pathname === '/api/generate-job-cards' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { whatsappOrder } = body;

        if (!whatsappOrder || typeof whatsappOrder !== 'string') {
          return new Response(JSON.stringify({ error: 'Invalid order input' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: 'Gemini API key is not configured in Cloudflare environment' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        const modelsToTry = [
          env.GEMINI_MODEL,
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
          'gemini-3.6-flash',
        ].filter(Boolean) as string[];

        let responseData = null;
        let lastError = null;

        for (const model of modelsToTry) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Parse the following WhatsApp order and extract job card details.
Extract: workName, size, gsm, totalGross. Preserve exact values, units, numbers and strings as written in the order without modifying them or adding extra words.
Return a valid JSON array of objects with keys: "workName", "size", "gsm", "totalGross".
Order: ${whatsappOrder}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (res.ok) {
              const json: any = await res.json();
              const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                responseData = JSON.parse(cleaned);
                break;
              }
            } else {
              const errText = await res.text();
              lastError = errText;
            }
          } catch (err: any) {
            lastError = err?.message || err;
          }
        }

        if (!responseData) {
          return new Response(
            JSON.stringify({ error: 'AI parsing failed. ' + (lastError || '') }),
            {
              status: 502,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        });
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: error?.message || 'Internal Server Error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Fallback: serve static assets (SPA)
    return env.ASSETS.fetch(request);
  },
};
