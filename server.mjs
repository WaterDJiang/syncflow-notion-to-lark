import http from 'http'
import { readFile, stat } from 'fs/promises'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, 'dist')
const port = process.env.PORT || 3000

const allowHeadersNotion = 'authorization,content-type,notion-version,x-requested-with'
const allowHeadersLark = 'authorization,content-type,x-requested-with'

const sendCors = (res, origin, headers) => {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', headers)
  res.setHeader('Access-Control-Max-Age', '600')
}

const forward = async (target, req, res, passHeaders) => {
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await new Promise(resolve => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
  })
  const outHeaders = {}
  for (const h of passHeaders) {
    const v = req.headers[h]
    if (v) outHeaders[h] = v
  }
  const r = await fetch(target, { method: req.method, headers: outHeaders, body })
  const text = await r.text()
  res.statusCode = r.status
  for (const [k, v] of r.headers) res.setHeader(k, v)
  res.end(text)
}

const serveStatic = async (pathname, res) => {
  let filePath = path.join(distDir, pathname)
  try {
    const st = await stat(filePath)
    if (st.isDirectory()) filePath = path.join(filePath, 'index.html')
  } catch {}
  try {
    const data = await readFile(filePath)
    res.statusCode = 200
    res.end(data)
  } catch {
    const index = path.join(distDir, 'index.html')
    const data = await readFile(index)
    res.statusCode = 200
    res.end(data)
  }
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true)
  const origin = req.headers.origin || '*'
  if (parsed.pathname.startsWith('/api/notion')) {
    if (req.method === 'OPTIONS') { sendCors(res, origin, allowHeadersNotion); res.statusCode = 204; return res.end() }
    sendCors(res, origin, allowHeadersNotion)
    const target = 'https://api.notion.com' + parsed.pathname.replace('/api/notion', '') + (parsed.search || '')
    return forward(target, req, res, ['authorization','content-type','notion-version','accept'])
  }
  if (parsed.pathname.startsWith('/api/lark')) {
    if (req.method === 'OPTIONS') { sendCors(res, origin, allowHeadersLark); res.statusCode = 204; return res.end() }
    sendCors(res, origin, allowHeadersLark)
    const target = 'https://open.feishu.cn' + parsed.pathname.replace('/api/lark', '') + (parsed.search || '')
    return forward(target, req, res, ['authorization','content-type','accept'])
  }
  return serveStatic(parsed.pathname, res)
})

server.listen(port)
