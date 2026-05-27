import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from '../lib/firebase'
import type { StockFolder } from '../types'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'

interface UploadTask {
  name: string
  progress: number
  done: boolean
  error?: string
}

interface Props {
  folder: StockFolder
  onUploadComplete: () => void
  onError?: (msg: string) => void
}

export default function StockUpload({ folder, onUploadComplete, onError }: Props) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startUploads = (files: File[]) => {
    if (files.length === 0) return

    const initial: UploadTask[] = files.map(f => ({ name: f.name, progress: 0, done: false }))
    setTasks(initial)

    let completed = 0

    const finalize = () => {
      onUploadComplete()
      setTimeout(() => setTasks([]), 1500)
    }

    files.forEach((file, idx) => {
      const storageRef = ref(storage, `story_images/stock/${folder}/${file.name}`)
      const task = uploadBytesResumable(storageRef, file)

      task.on(
        'state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
          setTasks(prev => prev.map((t, i) => i === idx ? { ...t, progress: pct } : t))
        },
        err => {
          setTasks(prev => prev.map((t, i) => i === idx ? { ...t, error: err.message, done: true } : t))
          onError?.(err.message)
          completed++
          if (completed === files.length) finalize()
        },
        () => {
          setTasks(prev => prev.map((t, i) => i === idx ? { ...t, progress: 100, done: true } : t))
          completed++
          if (completed === files.length) finalize()
        },
      )
    })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    startUploads(Array.from(e.dataTransfer.files))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    startUploads(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  return (
    <div>
      {/* ドロップゾーン */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        style={{
          border: `2px dashed ${dragging ? '#833AB4' : '#DBDBDB'}`,
          borderRadius: '10px',
          padding: '20px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(131,58,180,0.04)' : '#FAFAFA',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: '22px', marginBottom: '6px' }}>📁</div>
        <div style={{ fontSize: '13px', color: '#8E8E8E', fontWeight: 500 }}>
          複数ファイルを一括アップロード
        </div>
        <div style={{ fontSize: '11px', color: '#AAAAAA', marginTop: '4px' }}>
          JPG / PNG / MP4 対応
        </div>
      </div>

      {/* アップロード進捗リスト */}
      {tasks.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tasks.map((t, i) => (
            <div key={i}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#8E8E8E',
                marginBottom: '2px',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                  {t.name}
                </span>
                <span>{t.done ? (t.error ? '❌' : '✓') : `${t.progress}%`}</span>
              </div>
              <div style={{ height: '3px', background: '#DBDBDB', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${t.progress}%`,
                  background: t.error ? '#FD1D1D' : IG_GRADIENT,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}
