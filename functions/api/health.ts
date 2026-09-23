export async function onRequestGet() {
  return new Response(JSON.stringify({ status: 'ok', environment: 'cloudflare-pages' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
