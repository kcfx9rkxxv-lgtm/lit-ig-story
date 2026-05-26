import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { StockFile } from '../types'

interface Props {
  files: StockFile[]
  onDelete: (fullPath: string, name: string) => void | Promise<void>
}

const FILL: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const DELETE_BTN: CSSProperties = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  background: 'rgba(0,0,0,0.65)',
  color: '#FFF',
  border: 'none',
  borderRadius: '50%',
  width: '22px',
  height: '22px',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  zIndex: 1,
}

function isVideo(name: string): boolean {
  return name.toLowerCase().endsWith('.mp4')
}

export default function StockGrid({ files, onDelete }: Props) {
  const [preview, setPreview] = useState<StockFile | null>(null)

  if (files.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 16px',
        color: '#8E8E8E',
        fontSize: '14px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
        素材がまだありません
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px',
        padding: '2px',
      }}>
        {files.map(file => (
          <div
            key={file.fullPath}
            style={{
              position: 'relative',
              aspectRatio: '1',
              background: '#000',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            onClick={() => setPreview(file)}
          >
            {isVideo(file.name) ? (
              <>
                <video src={file.url} style={FILL} muted playsInline preload="metadata" />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '22px', color: '#FFF', opacity: 0.9 }}>▶</span>
                </div>
              </>
            ) : (
              <img src={file.url} alt={file.name} style={FILL} loading="lazy" />
            )}

            {/* 削除ボタン */}
            <button
              style={DELETE_BTN}
              onClick={e => {
                e.stopPropagation()
                onDelete(file.fullPath, file.name)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ライトボックス */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setPreview(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#FFF',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {isVideo(preview.name) ? (
            <video
              src={preview.url}
              controls
              autoPlay
              style={{ maxHeight: '85vh', maxWidth: '95vw' }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={preview.url}
              alt={preview.name}
              style={{ maxHeight: '85vh', maxWidth: '95vw', objectFit: 'contain' }}
              onClick={e => e.stopPropagation()}
            />
          )}

          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}>
            {preview.name}
          </div>
        </div>
      )}
    </>
  )
}
