import { useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './lib/firebase'
import Calendar from './components/Calendar'
import EditPanel from './components/EditPanel'
import StockManager from './components/StockManager'
import { useMonthData } from './hooks/useMonthData'

type TabType = 'calendar' | 'stock'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'

const HEADER_STYLE: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #DBDBDB',
  background: '#FFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 10,
}

const NAV_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  background: '#FFF',
  borderBottom: '1px solid #DBDBDB',
}

const NAV_BTN_STYLE: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '26px',
  cursor: 'pointer',
  color: '#262626',
  padding: '2px 12px',
  lineHeight: 1,
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'calendar', label: 'カレンダー' },
  { key: 'stock', label: 'ストック管理' },
]

export default function App() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState<TabType>('calendar')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { data, loading, refetch } = useMonthData(year, month)

  const handlePrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  const handleNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const handleSave = useCallback(async (date: string, formData: Record<string, unknown>) => {
    await setDoc(
      doc(db, 'daily_overrides', date),
      { ...formData, date, updated_at: serverTimestamp() },
      { merge: true },
    )
    await refetch()
  }, [refetch])

  const monthLabel = `${year}年${month}月`

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <div style={{ maxWidth: '430px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <header style={HEADER_STYLE}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: IG_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LIT 投稿管理
          </h1>
          <span style={{ fontSize: '13px', color: '#8E8E8E', fontWeight: 500 }}>
            {activeTab === 'calendar' ? monthLabel : 'ストック'}
          </span>
        </header>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', background: '#FFF', borderBottom: '1px solid #DBDBDB' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? '#833AB4' : 'transparent'}`,
                color: activeTab === tab.key ? '#833AB4' : '#8E8E8E',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'calendar' ? (
          <>
            {/* 月ナビゲーション */}
            <div style={NAV_STYLE}>
              <button onClick={handlePrev} style={NAV_BTN_STYLE}>‹</button>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#262626' }}>
                {monthLabel}
              </span>
              <button onClick={handleNext} style={NAV_BTN_STYLE}>›</button>
            </div>

            {/* カレンダー本体 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8E8E', fontSize: '14px' }}>
                読み込み中...
              </div>
            ) : (
              <Calendar
                year={year}
                month={month}
                monthData={data}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            )}
          </>
        ) : (
          <StockManager />
        )}
      </div>

      {/* 編集パネル（ボトムシートモーダル） */}
      {selectedDate && (
        <EditPanel
          date={selectedDate}
          initialData={data[selectedDate] ?? null}
          onSave={handleSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
