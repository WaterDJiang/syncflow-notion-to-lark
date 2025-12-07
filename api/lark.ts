export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = url.searchParams.get('origin') || '*';
  const path = url.pathname.replace(/^\/api\/lark/, '') + url.search;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with',
        'Access-Control-Max-Age': '600'
      }
    });
  }

  const target = `https://open.feishu.cn${path}`;

  // Forward selected headers only
  const inHeaders = new Headers(req.headers);
  const outHeaders = new Headers();
  const copyHeader = (name: string) => {
    const v = inHeaders.get(name);
    if (v) outHeaders.set(name, v);
  };
  copyHeader('authorization');
  copyHeader('content-type');
  copyHeader('accept');

  const forward = await fetch(target, {
    method: req.method,
    headers: outHeaders,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text()
  });

  const body = await forward.text();
  const respHeaders = new Headers(forward.headers);
  respHeaders.set('Access-Control-Allow-Origin', origin);
  respHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  respHeaders.set('Access-Control-Allow-Headers', 'authorization,content-type,x-requested-with');
  return new Response(body, { status: forward.status, headers: respHeaders });
}
