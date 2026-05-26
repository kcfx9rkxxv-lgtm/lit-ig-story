interface Props {
  value: string
  onChange: (value: string) => void
}

export default function TextEditor({ value, onChange }: Props) {
  const charCount = value.length
  const isOver = charCount > 80

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label style={{ fontSize: '13px', color: '#888' }}>投稿テキスト</label>
        <span style={{ fontSize: '12px', color: isOver ? '#f44336' : '#555' }}>
          {charCount}文字
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="空欄の場合はClaudeが自動生成します"
        style={{
          width: '100%',
          background: '#1A1A1A',
          border: `1px solid ${isOver ? '#f44336' : '#333'}`,
          borderRadius: '10px',
          color: '#F5F5F5',
          padding: '12px',
          fontSize: '14px',
          lineHeight: 1.7,
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  )
}
