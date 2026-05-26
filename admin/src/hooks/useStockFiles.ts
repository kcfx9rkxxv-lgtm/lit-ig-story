import { useState, useEffect, useCallback } from 'react'
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../lib/firebase'
import type { StockFolder, StockFile } from '../types'

export function useStockFiles(folder: StockFolder) {
  const [files, setFiles] = useState<StockFile[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const folderRef = ref(storage, `story_images/stock/${folder}`)
      const result = await listAll(folderRef)
      const fileData = await Promise.all(
        result.items.map(async item => ({
          name: item.name,
          url: await getDownloadURL(item),
          fullPath: item.fullPath,
        })),
      )
      setFiles(fileData)
    } catch (e) {
      console.error('ストックファイル取得エラー:', e)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [folder])

  useEffect(() => {
    load()
  }, [load])

  const deleteFile = useCallback(
    async (fullPath: string) => {
      try {
        await deleteObject(ref(storage, fullPath))
        await load()
      } catch (e) {
        console.error('削除エラー:', e)
      }
    },
    [load],
  )

  return { files, loading, refetch: load, deleteFile }
}
