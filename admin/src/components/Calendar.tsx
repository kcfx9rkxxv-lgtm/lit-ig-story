import type { CSSProperties } from 'react'
import type { DayData } from '../types'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface Props {
  year: number
  month: number
  monthData: Record<string, DayData>
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from<null>({ length: firstDow }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Calendar({ year, month, monthData, selectedDate, onDateSelect }: Props) {
  const cells = buildCells(year, month)
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ background: '#FFF', padding: '8px 4px' }}>
      {/* 曜日ヘッダー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 0',
              color: i === 0 ? '#FD1D1D' : i === 6 ? '#833AB4' : '#8E8E8E',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} style={{ aspectRatio: '1' }} />

          const ds = toDateStr(year, month, day)
          const d = monthData[ds]
          const isClosed = d?.type === 'closed'
          const isSpecial = d?.type === 'special'
          const isSelected = selectedDate === ds
          const isToday = todayStr === ds
          const hasImage = !!d?.image_url

          const cellStyle: CSSProperties = {
            aspectRatio: '1',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            background: isClosed
              ? '#F5F5F5'
              : isSelected
              ? `linear-gradient(#fff, #fff) padding-box, ${IG_GRADIENT} border-box`
              : isSpecial
              ? `linear-gradient(#fff, #fff) padding-box, ${IG_GRADIENT} border-box`
              : hasImage
              ? '#000'
              : '#FAFAFA',
            border: isSelected || isSpecial ? '2px solid transparent' : '2px solid transparent',
            opacity: isClosed ? 0.5 : 1,
            transition: 'transform 0.1s',
          }

          return (
            <div
              key={ds}
              style={cellStyle}
              onClick={() => !isClosed && onDateSelect(ds)}
            >
              {/* サムネイル画像 */}
              {hasImage && !isClosed && (
                <img
                  src={d.image_url}
                  alt={ds}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.85,
                  }}
                />
              )}

              {/* 日付ラベル */}
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '4px',
                  fontSize: '10px',
                  fontWeight: isToday ? 700 : 500,
                  color: isClosed
                    ? '#AAAAAA'
                    : hasImage
                    ? '#FFF'
                    : isToday
                    ? '#FD1D1D'
                    : '#262626',
                  textShadow: hasImage ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
                  zIndex: 1,
                  lineHeight: 1,
                }}
              >
                {day}
              </div>

              {/* 休業ラベル */}
              {isClosed && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#AAAAAA',
                    fontWeight: 600,
                  }}
                >
                  休
                </div>
              )}

              {/* 特別日マーカー（画像なし時） */}
              {isSpecial && !isClosed && !hasImage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '3px',
                    fontSize: '9px',
                    lineHeight: 1,
                  }}
                >
                  ⭐
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
