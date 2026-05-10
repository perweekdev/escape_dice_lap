import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { gameConfig } from './config'

let gameInstance: Phaser.Game | null = null

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gameInstance || !containerRef.current) return

    gameInstance = new Phaser.Game({
      ...gameConfig,
      parent: containerRef.current,
    })

    return () => {
      if (gameInstance) {
        gameInstance.destroy(true)
        gameInstance = null
      }
    }
  }, [])

  return <div ref={containerRef} />
}
