const LABEL_STYLE: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#8E8E8E',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function TextEditor({ value, onChange }: Props) {
  const charCount = value.length
  const isOver = charCount > 80

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={LABEL_STYLE}>投稿テキスト</label>
        <span style={{ fontSize: '12px', color: isOver ? '#FD1D1D' : '#8E8E8E' }}>
          {charCount}文字
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder="空欄の場合はClaudeが自動生成します"
        style={{
          width: '100%',
          border: `1px solid ${isOver ? '#FD1D1D' : '#DBDBDB'}`,
          borderRadius: '8px',
          color: '#262626',
          background: '#FAFAFA',
          padding: '10px 12px',
          fontSize: '14px',
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  )
}
