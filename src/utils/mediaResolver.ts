/**
 * utils/mediaResolver.ts
 *
 * 与えられたフル URL から「public 配下の安全なパス」「想定される Content-Type」「メディア種別」を
 * 決定して返す純粋関数群。
 *
 * 注意:
 * - これは副作用を持たない純粋関数です。実際にファイルを取得する fetch 等は呼び出し側で行ってください。
 * - public 配下への参照であることを検証し、パストラバーサル（".."）等を無効化します。
 */

export type MediaType = 'image' | 'audio' | 'video' | 'font' | 'text' | 'other'

export type ResolvedMedia = {
  ok: boolean
  /**
   * 正常時は public 以下の正規化されたパス（先頭に /public を含む）
   * 例: /public/sfx/correct.mp3
   */
  publicPath?: string
  /** 想定される MIME type（拡張子から推測） */
  contentType?: string | null
  mediaType?: MediaType
  /** 問題がある場合の説明 */
  reason?: string
}

const extToMime: Record<string, string> = {
  // images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  // audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  // video
  mp4: 'video/mp4',
  webm: 'video/webm',
  // fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  // text / misc
  txt: 'text/plain',
  json: 'application/json',
  csv: 'text/csv',
  pdf: 'application/pdf',
}

function guessMediaTypeFromExt(ext: string): MediaType {
  const e = ext.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image'
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(e)) return 'audio'
  if (['mp4', 'webm', 'ogg'].includes(e)) return 'video'
  if (['woff', 'woff2', 'ttf', 'otf'].includes(e)) return 'font'
  if (['txt', 'csv', 'json'].includes(e)) return 'text'
  return 'other'
}

function getExtFromPath(p: string): string | null {
  const i = p.lastIndexOf('.')
  if (i === -1) return null
  return p.slice(i + 1).toLowerCase()
}

/**
 * シンプルなパス正規化（ブラウザ実行でも動く実装）。
 * - 連続する '/' を潰す
 * - '.' を削除
 * - '..' を解決（上位がなければ失敗フラグを出す）
 */
export function normalizePath(pathname: string): { ok: boolean; normalized?: string; reason?: string } {
  if (!pathname) return { ok: false, reason: 'empty path' }
  // keep leading slash if present
  const leading = pathname.startsWith('/')
  const parts = pathname.split('/').filter((p) => p.length > 0)
  const out: string[] = []
  for (const p of parts) {
    if (p === '.') continue
    if (p === '..') {
      if (out.length === 0) {
        return { ok: false, reason: 'path traversal would escape root' }
      }
      out.pop()
      continue
    }
    out.push(p)
  }
  const normalized = (leading ? '/' : '') + out.join('/')
  return { ok: true, normalized }
}

/**
 * 与えられたフル URL を解析して public 配下の安全なパスを返す純粋関数。
 * - 引数はフル URL でも相対 URL でもよい（例: "http://localhost:5173/public/sfx/correct.mp3" または "/public/sfx/correct.mp3"）。
 * - public 配下でないパスは拒否される。
 */
export function resolvePublicUrl(fullUrl: string): ResolvedMedia {
  if (!fullUrl) return { ok: false, reason: 'empty url' }
  let url: URL | null = null
  try {
    // try absolute
    url = new URL(fullUrl)
  } catch (e) {
    try {
      // try relative as pathname
      // create a dummy base so URL parses
      url = new URL(fullUrl, 'http://localhost')
    } catch (e2) {
      return { ok: false, reason: 'invalid URL' }
    }
  }

  const pathname = url.pathname || '/'
  // must start with /public/
  if (!pathname.startsWith('/public/')) {
    return { ok: false, reason: 'url path is not under /public/' }
  }

  // normalize and guard against traversal
  const normalizedRes = normalizePath(pathname)
  if (!normalizedRes.ok) return { ok: false, reason: normalizedRes.reason }
  const normalized = normalizedRes.normalized as string

  // ensure normalized still starts with /public
  if (!normalized.startsWith('/public/')) return { ok: false, reason: 'path normalization escaped /public/' }

  const ext = getExtFromPath(normalized)
  const contentType = ext ? (extToMime[ext] ?? null) : null
  const mediaType = ext ? guessMediaTypeFromExt(ext) : 'other'

  return { ok: true, publicPath: normalized, contentType, mediaType }
}

/**
 * 使用例（純粋関数）:
 * const r = resolvePublicUrl('http://localhost:5173/public/sfx/correct.mp3')
 * if (r.ok) {
 *   // 実際の fetch 等は副作用なので外で行う
 *   // const resp = await fetch(r.publicPath)  // ブラウザでは同一オリジンなら可
 * }
 */
