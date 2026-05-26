import { useState, type KeyboardEvent } from 'react'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#8E8E8E',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

interface Props {
  mentions: string[]
  onChange: (mentions: string[]) => void
}

export default function MentionInput({ mentions, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (!val) return
    const mention = val.startsWith('@') ? val : `@${val}`
    if (!mentions.includes(mention)) onChange([...mentions, mention])
    setInput('')
  }

  const remove = (i: number) => onChange(mentions.filter((_, idx) => idx !== i))

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div>
      <label style={LABEL_STYLE}>メンション</label>

      {mentions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {mentions.map((m, i) => (
            <button
              key={i}
              onClick={() => remove(i)}
              style={{
                background: IG_GRADIENT,
                color: '#FFF',
                border: 'none',
                borderRadius: '16px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {m} <span style={{ opacity: 0.8, fontSize: '10px' }}>×</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="@アカウント名 → Enter で追加"
          style={{
            flex: 1,
            border: '1px solid #DBDBDB',
            borderRadius: '8px',
            color: '#262626',
            background: '#FAFAFA',
            padding: '10px 12px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={add}
          style={{
            background: IG_GRADIENT,
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          追加
        </button>
      </div>
    </div>
  )
}
