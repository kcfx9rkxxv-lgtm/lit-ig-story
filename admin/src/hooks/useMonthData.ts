import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DayData } from '../types'

export function useMonthData(year: number, month: number) {
  const [data, setData] = useState<Record<string, DayData>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const mm = String(month).padStart(2, '0')
      const q = query(
        collection(db, 'daily_overrides'),
        where('date', '>=', `${year}-${mm}-01`),
        where('date', '<=', `${year}-${mm}-31`),
      )
      const snapshot = await getDocs(q)
      const result: Record<string, DayData> = {}
      snapshot.forEach(doc => {
        result[doc.id] = doc.data() as DayData
      })
      setData(result)
    } catch (e) {
      console.error('月データ取得エラー:', e)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, refetch: load }
}
