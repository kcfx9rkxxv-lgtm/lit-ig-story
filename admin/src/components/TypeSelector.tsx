import type { PostType } from '../types'

interface Props {
  value: PostType
  onChange: (type: PostType) => void
}

const TYPES: { type: PostType; icon: string; label: string }[] = [
  { type: 'normal', icon: '🌙', label: '通常' },
  { type: 'special', icon: '⭐', label: '特別' },
  { type: 'closed', icon: '🔒', label: '休業' },
]

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'

export default function TypeSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {TYPES.map(({ type, icon, label }) => {
        const active = value === type
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: '2px solid transparent',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: active ? 700 : 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: active
                ? `linear-gradient(#fff, #fff) padding-box, ${IG_GRADIENT} border-box`
                : '#FAFAFA',
              color: active ? '#262626' : '#8E8E8E',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
