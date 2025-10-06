import { useEffect, useRef, useCallback } from 'react'

export function useBroadcast(channelName: string, onMessage?: (data: any) => void) {
  const bcRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const bc = new BroadcastChannel(channelName)
    bcRef.current = bc
    const handler = (ev: MessageEvent) => {
      try {
        if (onMessage) onMessage(ev.data)
      } catch (e) {
        // swallow
      }
    }
    bc.addEventListener('message', handler)
    return () => {
      bc.removeEventListener('message', handler)
      try { bc.close() } catch (e) {}
      bcRef.current = null
    }
  }, [channelName, onMessage])

  const postMessage = useCallback((data: any) => {
    try {
      bcRef.current?.postMessage(data)
    } catch (e) {
      // ignore
    }
  }, [])

  const subscribe = useCallback((cb: (data: any) => void) => {
    const bc = new BroadcastChannel(channelName)
    const wrapper = (ev: MessageEvent) => cb(ev.data)
    bc.addEventListener('message', wrapper)
    return () => {
      bc.removeEventListener('message', wrapper)
      try { bc.close() } catch (e) {}
    }
  }, [channelName])

  return { postMessage, subscribe }
}
