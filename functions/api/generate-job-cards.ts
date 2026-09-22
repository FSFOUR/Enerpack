// Cloudflare Pages Functions endpoint for /api/generate-job-cards
interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
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
      // Return a 200 with locally parsed fallback or inform client
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
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
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
      JSON.stringify({ error: error?.message || 'Server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
