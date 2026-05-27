import { useState } from 'react'
import type { StockFolder } from '../types'
import { useStockFiles } from '../hooks/useStockFiles'
import StockUpload from './StockUpload'
import StockGrid from './StockGrid'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'

const FOLDERS: { key: StockFolder; icon: string; label: string }[] = [
  { key: 'normal', icon: '🌙', label: '通常' },
  { key: 'special', icon: '⭐', label: '特別' },
  { key: 'seasonal', icon: '🌸', label: '季節' },
]

export default function StockManager() {
  const [folder, setFolder] = useState<StockFolder>('normal')
  const [toast, setToast] = useState<string | null>(null)
  const { files, loading, refetch, deleteFile } = useStockFiles(folder)

  const showError = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (fullPath: string, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteFile(fullPath)
    } catch {
      showError('削除に失敗しました')
    }
  }

  return (
    <div>
      {/* フォルダ選択 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        background: '#FFF',
        borderBottom: '1px solid #DBDBDB',
      }}>
        {FOLDERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFolder(f.key)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: folder === f.key ? IG_GRADIENT : '#FAFAFA',
              color: folder === f.key ? '#FFF' : '#8E8E8E',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: folder === f.key ? 700 : 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '18px' }}>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* アップロードエリア */}
      <div style={{
        padding: '12px 16px',
        background: '#FFF',
        borderBottom: '1px solid #DBDBDB',
      }}>
        <StockUpload folder={folder} onUploadComplete={refetch} onError={showError} />
      </div>

      {/* ファイル一覧 */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0',
          color: '#8E8E8E',
          fontSize: '14px',
        }}>
          読み込み中...
        </div>
      ) : (
        <StockGrid files={files} onDelete={handleDelete} />
      )}

      {/* エラートースト */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
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
          {toast}
        </div>
      )}
    </div>
  )
}
