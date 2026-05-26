import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './lib/firebase'
import DateSelector from './components/DateSelector'
import TextEditor from './components/TextEditor'
import MentionInput from './components/MentionInput'

interface Toast {
  msg: string
  ok: boolean
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [date, setDate] = useState(todayStr())
  const [customText, setCustomText] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // 日付変更時にFirestoreから該当データを自動ロード
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setCustomText('')
      setMentions([])
      try {
        const snap = await getDoc(doc(db, 'daily_overrides', date))
        if (snap.exists()) {
          const data = snap.data()
          setCustomText(data.custom_text ?? '')
          setMentions(data.mentions ?? [])
        }
      } catch (e) {
        console.error('Firestore load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [date])

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2000)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'daily_overrides', date),
        {
          date,
          custom_text: customText,
          mentions,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      )
      showToast('保存しました ✓', true)
    } catch (e) {
      console.error('Firestore save error:', e)
      showToast('エラーが発生しました', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#0D0D0D',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '32px 20px 48px',
        }}
      >
        {/* ヘッダー */}
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#C9A84C',
            textAlign: 'center',
            marginBottom: '36px',
          }}
        >
          LIT 投稿管理
        </h1>

        {/* 日付選択 */}
        <section style={{ marginBottom: '24px' }}>
          <DateSelector date={date} onChange={setDate} />
        </section>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              color: '#555',
              padding: '60px 0',
              fontSize: '14px',
            }}
          >
            読み込み中...
          </div>
        ) : (
          <>
            {/* 投稿テキスト */}
            <section style={{ marginBottom: '24px' }}>
              <TextEditor value={customText} onChange={setCustomText} />
            </section>

            {/* メンション */}
            <section style={{ marginBottom: '36px' }}>
              <MentionInput mentions={mentions} onChange={setMentions} />
            </section>

            {/* 保存ボタン */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: saving ? '#8a7030' : '#C9A84C',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                letterSpacing: '0.08em',
                transition: 'background-color 0.2s',
              }}
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </>
        )}
      </div>

      {/* トースト通知 */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.ok ? '#0f2b0f' : '#2b0f0f',
            color: toast.ok ? '#66bb6a' : '#ef5350',
            border: `1px solid ${toast.ok ? '#66bb6a' : '#ef5350'}`,
            padding: '12px 28px',
            borderRadius: '10px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
