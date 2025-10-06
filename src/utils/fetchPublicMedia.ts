import { resolvePublicUrl } from './mediaResolver'

export type FetchPublicMediaResult = {
  blob: Blob
  contentType: string | null
  mediaType: string | undefined
  publicPath: string
}

export async function fetchPublicMedia(fullUrl: string, init?: RequestInit): Promise<FetchPublicMediaResult> {
  const r = resolvePublicUrl(fullUrl)
  if (!r.ok) throw new Error(r.reason || 'invalid public url')
  const publicPath = r.publicPath!

  const resp = await fetch(publicPath, init)
  if (!resp.ok) throw new Error(`fetch failed: HTTP ${resp.status}`)
  const blob = await resp.blob()

  // resp.headers.get('content-type') may be present; prefer that when available
  const ct = resp.headers.get('content-type') ?? r.contentType ?? null

  return { blob, contentType: ct, mediaType: r.mediaType, publicPath }
}

export async function fetchAndCreateObjectUrl(fullUrl: string): Promise<{ objectUrl: string; contentType: string | null; mediaType: string | undefined }> {
  const res = await fetchPublicMedia(fullUrl)
  const objectUrl = URL.createObjectURL(res.blob)
  return { objectUrl, contentType: res.contentType, mediaType: res.mediaType }
}
