
'use client'
import { useEffect } from 'react'

export default function DisableZoom() {
  useEffect(() => {
    // Запрещаем зум через мета-тег
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    document.getElementsByTagName('head')[0].appendChild(meta)
    
    // Предотвращаем жесты масштабирования
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return null
}