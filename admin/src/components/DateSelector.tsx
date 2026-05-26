import type { CSSProperties } from 'react'

interface Props {
  date: string
  onChange: (date: string) => void
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS[d.getDay()]}）`
}

function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

const btnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #333',
  color: '#F5F5F5',
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default function DateSelector({ date, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '10px',
        padding: '12px 16px',
      }}
    >
      <button style={btnStyle} onClick={() => onChange(shiftDate(date, -1))}>
        ＜
      </button>
      <span
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0.03em',
        }}
      >
        {formatDisplay(date)}
      </span>
      <button style={btnStyle} onClick={() => onChange(shiftDate(date, 1))}>
        ＞
      </button>
    </div>
  )
}
