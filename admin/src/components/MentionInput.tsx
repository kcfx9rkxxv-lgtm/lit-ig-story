import { useState, type KeyboardEvent } from 'react'

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
    if (!mentions.includes(mention)) {
      onChange([...mentions, mention])
    }
    setInput('')
  }

  const remove = (index: number) => {
    onChange(mentions.filter((_, i) => i !== index))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>
        メンション
      </label>

      {mentions.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          {mentions.map((m, i) => (
            <button
              key={i}
              onClick={() => remove(i)}
              style={{
                background: 'transparent',
                border: '1px solid #C9A84C',
                color: '#C9A84C',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {m}
              <span style={{ fontSize: '11px', opacity: 0.7 }}>×</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="@アカウント名 → Enter で追加"
          style={{
            flex: 1,
            background: '#1A1A1A',
            border: '1px solid #333',
            borderRadius: '10px',
            color: '#F5F5F5',
            padding: '10px 12px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={add}
          style={{
            background: 'transparent',
            border: '1px solid #C9A84C',
            color: '#C9A84C',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          追加
        </button>
      </div>
    </div>
  )
}
