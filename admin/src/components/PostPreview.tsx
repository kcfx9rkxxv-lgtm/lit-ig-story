import type { CSSProperties } from 'react'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'
const ACCOUNT = '@under22.come_on'

const FILL: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

interface Props {
  imageUrl: string
  customText: string
  mentions: string[]
}

export default function PostPreview({ imageUrl, customText, mentions }: Props) {
  const isVideo = imageUrl.toLowerCase().includes('.mp4')

  return (
    <div>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#8E8E8E',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        投稿プレビュー
      </div>

      {/* 9:16 フレーム */}
      <div style={{
        width: '100%',
        maxWidth: '150px',
        aspectRatio: '9/16',
        background: '#1A1A1A',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {/* 背景メディア */}
        {imageUrl ? (
          isVideo ? (
            <video src={imageUrl} style={FILL} autoPlay muted loop playsInline />
          ) : (
            <img src={imageUrl} alt="preview" style={FILL} />
          )
        ) : (
          <div style={{
            ...FILL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <span style={{ fontSize: '24px' }}>📷</span>
            <span style={{ color: '#555', fontSize: '9px' }}>画像を選択</span>
          </div>
        )}

        {/* グラデーションオーバーレイ */}
        {imageUrl && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 28%, transparent 55%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }} />
        )}

        {/* 上部: アカウント情報 */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          zIndex: 1,
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: IG_GRADIENT,
            flexShrink: 0,
            border: '1.5px solid rgba(255,255,255,0.8)',
          }} />
          <span style={{
            color: '#FFF',
            fontSize: '9px',
            fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            letterSpacing: '0.02em',
          }}>
            {ACCOUNT}
          </span>
        </div>

        {/* 下部: テキストオーバーレイ */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '8px',
          right: '8px',
          zIndex: 1,
        }}>
          {customText ? (
            <p style={{
              color: '#FFF',
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: mentions.length > 0 ? '3px' : 0,
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              wordBreak: 'break-all',
            }}>
              {customText}
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontStyle: 'italic' }}>
              テキストが入ります
            </p>
          )}
          {mentions.length > 0 && (
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '9px',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              letterSpacing: '0.01em',
            }}>
              {mentions.join(' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
