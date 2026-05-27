import { useState, useEffect } from 'react'
import type { DayData, PostType } from '../types'
import ImageUpload from './ImageUpload'
import TypeSelector from './TypeSelector'
import TextEditor from './TextEditor'
import MentionInput from './MentionInput'
import PostPreview from './PostPreview'

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
  date: string
  initialData: DayData | null
  onSave: (date: string, data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

function formatDate(ds: string): string {
  const d = new Date(ds + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

export default function EditPanel({ date, initialData, onSave, onClose }: Props) {
  const [type, setType] = useState<PostType>(initialData?.type ?? 'normal')
  const [openTime, setOpenTime] = useState(initialData?.open_time ?? '20:00')
  const [customText, setCustomText] = useState(initialData?.custom_text ?? '')
  const [mentions, setMentions] = useState<string[]>(initialData?.mentions ?? [])
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // 日付が変わったらフォームをリセット
  useEffect(() => {
    setType(initialData?.type ?? 'normal')
    setOpenTime(initialData?.open_time ?? '20:00')
    setCustomText(initialData?.custom_text ?? '')
    setMentions(initialData?.mentions ?? [])
    setImageUrl(initialData?.image_url ?? '')
  }, [date, initialData])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(date, { type, open_time: openTime, custom_text: customText, mentions, image_url: imageUrl })
      showToast('保存しました ✓', true)
    } catch {
      showToast('エラーが発生しました', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* オーバーレイ */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 100,
        }}
      />

      {/* ボトムシート */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          background: '#FFF',
          borderRadius: '20px 20px 0 0',
          zIndex: 101,
          maxHeight: '90vh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        }}
      >
        {/* ドラッグハンドル */}
        <div style={{ paddingTop: '12px', paddingBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#DBDBDB' }} />
        </div>

        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px 14px',
            borderBottom: '1px solid #DBDBDB',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#262626' }}>
            {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#F5F5F5',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#8E8E8E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* フォーム */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 投稿プレビュー（リアルタイム更新） */}
          <section>
            <PostPreview imageUrl={imageUrl} customText={customText} mentions={mentions} />
          </section>

          {/* 画像アップロード */}
          <section>
            <label style={LABEL_STYLE}>画像 / 動画</label>
            <ImageUpload date={date} imageUrl={imageUrl} onUploadComplete={setImageUrl} onError={msg => showToast(msg, false)} />
          </section>

          {/* 投稿タイプ */}
          <section>
            <label style={LABEL_STYLE}>投稿タイプ</label>
            <TypeSelector value={type} onChange={setType} />
          </section>

          {type !== 'closed' && (
            <>
              {/* オープン時間 */}
              <section>
                <label style={LABEL_STYLE} htmlFor="open-time">オープン時間</label>
                <input
                  id="open-time"
                  type="time"
                  value={openTime}
                  onChange={e => setOpenTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DBDBDB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#262626',
                    background: '#FAFAFA',
                    outline: 'none',
                  }}
                />
              </section>

              {/* 投稿テキスト */}
              <section>
                <TextEditor value={customText} onChange={setCustomText} />
              </section>

              {/* メンション */}
              <section>
                <MentionInput mentions={mentions} onChange={setMentions} />
              </section>
            </>
          )}

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#DBDBDB' : IG_GRADIENT,
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#262626',
            color: '#FFF',
            padding: '10px 24px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 500,
            zIndex: 200,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  )
}
