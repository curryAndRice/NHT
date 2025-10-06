import React, { useEffect, useState } from 'react'
import { resolvePublicUrl } from '../utils/mediaResolver'

// MediaTester
// 使い方:
// 1) プロジェクトの public フォルダ（または Vite の PUBLIC_CONTENT_DIR に設定したディレクトリ）に
//    サンプルファイルを置きます。例: public/sfx/correct.mp3, public/img/sample.png
// 2) このコンポーネントを App か ParticipantPage にインポートして表示してください。
//    例: import MediaTester from '../components/MediaTester'
//          <MediaTester />
// 3) URL 欄に http://localhost:5173/public/sfx/correct.mp3 などを入れて "Test" を押すと
//    resolvePublicUrl の結果が表示され、ファイルが fetch されてプレビューされます。

export default function MediaTester(): JSX.Element {
  const [input, setInput] = useState<string>('/public/sfx/correct.mp3')
  const [info, setInfo] = useState<any | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const samples = [
    '/public/software/sfx/correct.mp3',
    '/public/img/sample.png',
    '/public/video/sample.mp4',
  ]

  async function handleTest() {
    setError(null)
    setInfo(null)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }

    const r = resolvePublicUrl(input)
    if (!r.ok) {
      setError(r.reason || 'invalid URL')
      return
    }
    setInfo(r)

    try {
      setLoading(true)
      const resp = await fetch(r.publicPath!)
      if (!resp.ok) {
        setError(`HTTP ${resp.status}`)
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      setObjectUrl(url)
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Media Tester</h3>
      <div style={{ marginBottom: 8 }}>
        <input
          style={{ width: '70%' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button style={{ marginLeft: 8 }} onClick={handleTest} disabled={loading}>
          Test
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Samples:</strong>
        {samples.map((s) => (
          <button key={s} style={{ marginLeft: 8 }} onClick={() => setInput(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && <div>loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {info && (
        <div style={{ marginTop: 12 }}>
          <h4>Resolved Info</h4>
          <pre style={{ maxWidth: 800, whiteSpace: 'pre-wrap' }}>{JSON.stringify(info, null, 2)}</pre>
        </div>
      )}

      {objectUrl && info && (
        <div style={{ marginTop: 12 }}>
          <h4>Preview</h4>
          {info.mediaType === 'image' && (
            <img src={objectUrl} alt="preview" style={{ maxWidth: '80%', height: 'auto', border: '1px solid #ccc' }} />
          )}
          {info.mediaType === 'audio' && (
            <audio controls src={objectUrl} style={{ width: '80%' }} />
          )}
          {info.mediaType === 'video' && (
            <video controls src={objectUrl} style={{ maxWidth: '80%' }} />
          )}
          {info.mediaType === 'other' && (
            <div>
              <a href={objectUrl} target="_blank" rel="noreferrer">Open resource</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
