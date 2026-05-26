import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'

const IG_GRADIENT = 'linear-gradient(45deg, #833AB4, #FD1D1D, #F77737)'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']

interface Props {
  date: string
  imageUrl: string
  onUploadComplete: (url: string) => void
}

export default function ImageUpload({ date, imageUrl, onUploadComplete }: Props) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('対応ファイル: JPG / PNG / WebP / MP4')
      return
    }
    setError(null)
    setProgress(0)

    const storageRef = ref(storage, `story_images/${date}/${file.name}`)
    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err => { setError(err.message); setProgress(null) },
      () => {
        getDownloadURL(task.snapshot.ref).then(url => {
          onUploadComplete(url)
          setProgress(null)
        })
      },
    )
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const isVideo = imageUrl.includes('video') || imageUrl.toLowerCase().includes('.mp4')

  return (
    <div>
      {imageUrl ? (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '9/16' }}>
          {isVideo ? (
            <video
              src={imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              controls
            />
          ) : (
            <img
              src={imageUrl}
              alt="プレビュー"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.65)',
              color: '#FFF',
              border: 'none',
              borderRadius: '16px',
              padding: '6px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            変更
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? '#833AB4' : '#DBDBDB'}`,
            borderRadius: '12px',
            padding: '48px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(131,58,180,0.04)' : '#FAFAFA',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📷</div>
          <div style={{ fontSize: '14px', color: '#8E8E8E', fontWeight: 500 }}>
            タップ または ドラッグ&ドロップ
          </div>
          <div style={{ fontSize: '12px', color: '#AAAAAA', marginTop: '6px' }}>
            JPG / PNG / WebP / MP4 対応
          </div>
        </div>
      )}

      {/* アップロード進捗バー */}
      {progress !== null && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ height: '3px', background: '#DBDBDB', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: IG_GRADIENT,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#8E8E8E', textAlign: 'center', marginTop: '4px' }}>
            アップロード中 {progress}%
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: '12px', color: '#FD1D1D', marginTop: '8px' }}>{error}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}
