export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/notion/, '');
  const target = new URL(`https://api.notion.com${path}${url.search}`);

  const headers = new Headers(req.headers);
  // Ensure Notion-Version is preserved; add CORS
  const res = await fetch(target.toString(), {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()
  });

  const outHeaders = new Headers(res.headers);
  outHeaders.set('Access-Control-Allow-Origin', '*');
  outHeaders.set('Access-Control-Allow-Headers', '*');
  outHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  const body = await res.text();
  return new Response(body, { status: res.status, headers: outHeaders });
}
