import { useEffect } from 'react'

export function useKeyHandler(onKeyDown: (e: KeyboardEvent) => void, onKeyUp?: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const kd = (e: KeyboardEvent) => onKeyDown(e)
    const ku = (e: KeyboardEvent) => { if (onKeyUp) onKeyUp(e) }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [onKeyDown, onKeyUp])
}