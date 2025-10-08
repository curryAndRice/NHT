// microbit-webserial-react.tsx
// React + TypeScript component that connects to a micro:bit via Web Serial API
// - Serve the page on https:// or http://localhost
// - User must click "Connect" to open the browser port chooser
// - Default micro:bit baudRate = 115200
// - This is a single-file React component (default export)
import { isDebug } from '../context/GameContext';
import React, { useEffect, useRef, useState } from 'react';

// TransformStream 用の行分割ユーティリティ
class LineBreakTransformer {
  private buffer = '';
  transform(chunk: string, controller: TransformStreamDefaultController<string>) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r\n|\n/);
    this.buffer = lines.pop() ?? '';
    for (const line of lines) controller.enqueue(line);
  }
  flush(controller: TransformStreamDefaultController<string>) {
    if (this.buffer) controller.enqueue(this.buffer);
    this.buffer = '';
  }
}

export function normalizeToPcolonOption(raw: string): string | undefined {
  const s = raw.trim();
  // 許容するパターン: optional "P"/"player", digits, optional separator (colon/comma/space/dash/none), option letter A-D
  const m = s.match(/^(?:P|player)?\s*(\d+)\s*[:,\-\s]?\s*([A-D])$/i);
  if (!m) return undefined;
  const playerNum = parseInt(m[1], 10);
  const opt = m[2].toUpperCase();
  if (Number.isNaN(playerNum) || !/^[A-D]$/.test(opt)) return undefined;
  return `P${playerNum}:${opt}`;
}


type Props = {
  onLine: (line: string) => void;
};

export default function MicrobitWebSerial({onLine} : Props): JSX.Element {
  const [supported] = useState<boolean>(() => 'serial' in navigator);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('未接続');
  const [logs, setLogs] = useState<string[]>([]);
  const portRef = useRef<any | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // コンポーネント破棄時にクリーンアップ
      disconnect().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendLog = (line: string) => {
    // コンソールにも出す
    console.log(line);
    setLogs((prev) => {
      const next = [...prev, line];
      // ログが大きくなりすぎないよう最後の 1000 行だけ保持
      if (next.length > 1000) return next.slice(next.length - 1000);
      return next;
    });
  };

  async function connect() {
    try {
      if (!supported) {
        setStatus('Web Serial API 非対応のブラウザです。Chrome を使用してください。');
        return;
      }

      setStatus('ポート選択中…');
      // micro:bit の USB ベンダー ID をフィルタに入れることもできます (例: 0x0d28)
      const filters: any[] = [
        { usbVendorId: 0x0d28 }
      ];

      // ユーザー操作のコンテキストでポート選択ダイアログを開く
      const port = await (navigator as any).serial.requestPort({ filters });
      portRef.current = port;

      setStatus('開いています…');
      // micro:bit のデフォルトは 115200
      await port.open({ baudRate: 115200 });
      setConnected(true);
      setStatus('接続済み');

      // Readable (Uint8Array) -> TextDecoderStream -> 行分割 -> reader
      const textDecoder = new TextDecoderStream();
      // pipeTo はエラーで落ちることがあるため待たない形で実行
      (port.readable as ReadableStream<Uint8Array>).pipeTo(textDecoder.writable).catch((err) => {
        console.error('pipeTo error', err);
      });

      const lineStream = textDecoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
      const reader = lineStream.getReader();
      readerRef.current = reader;

      setStatus('受信中');

      // 読み取りループ: await read() で待つため busy-loop ではない
      while (mountedRef.current && readerRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value !== undefined) {
          appendLog(value);
          onLine(value);
        }
      }

      // ループ終了
      setStatus('切断済み');
      setConnected(false);

    } catch (err: any) {
      console.error('接続エラー', err);
      setStatus('接続エラー: ' + (err?.message ?? String(err)));
      setConnected(false);
    }
  }

  async function disconnect() {
    try {
      setStatus('切断中…');
      // cancel reader
      if (readerRef.current) {
        try { await readerRef.current.cancel(); } catch (_) {}
        try { readerRef.current.releaseLock(); } catch (_) {}
        readerRef.current = null;
      }
      // close port
      if (portRef.current) {
        try { await portRef.current.close(); } catch (_) {}
        portRef.current = null;
      }
    } catch (err) {
      console.error('切断エラー', err);
    } finally {
      setConnected(false);
      setStatus('切断済み');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">micro:bit シリアル受信 (React + TypeScript)</h1>

      <div className="space-x-2 mb-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          onClick={connect}
          disabled={!supported || connected}
        >
          Connect
        </button>

        <button
          className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
          onClick={() => disconnect()}
          disabled={!connected}
        >
          Disconnect
        </button>

        <span className="ml-4 align-middle">状態: <strong>{status}</strong></span>
      </div>

      {isDebug && <>
        <div className="mb-2 text-sm text-gray-600">注意: ページは HTTPS または http://localhost で提供してください。micro:bit のデフォルトボーレートは 115200 です。</div>

        <div className="border rounded p-3 bg-white" style={{ minHeight: 300 }}>
          <div className="text-sm text-gray-500 mb-2">受信ログ（最新 1000 行まで）</div>
          <div className="whitespace-pre-wrap overflow-auto" style={{ maxHeight: 420 }}>
            {logs.length === 0 ? (
              <div className="text-gray-400">ここに micro:bit からの行が表示されます。</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="text-sm font-mono">{l}</div>
              ))
            )}
          </div>
        </div>
      </>}

    </div>
  );
}
