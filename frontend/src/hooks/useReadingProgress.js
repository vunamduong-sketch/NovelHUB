import { useCallback, useEffect, useRef } from 'react'

import { recordReadingProgress } from '../api/readingHistoryApi.js'
import { useAuth } from '../auth/useAuth.js'

export function useReadingProgress({
  chapterId,
  chapter,
  loading,
  error,
  articleRef,
}) {
  const { user } = useAuth()
  const timerRef = useRef(null)

  const getReadingPosition = useCallback(() => {
    const article = articleRef.current

    if (!article) {
      return {
        position_offset: 0,
        progress_percent: 0,
      }
    }

    const articleTop =
      article.getBoundingClientRect().top + window.scrollY

    const articleHeight = article.scrollHeight

    const maxOffset = Math.max(
      0,
      articleHeight - window.innerHeight,
    )

    const offset = Math.max(
      0,
      Math.min(
        maxOffset,
        window.scrollY - articleTop,
      ),
    )

    const progress =
      maxOffset === 0
        ? 100
        : Math.min(100, (offset / maxOffset) * 100)

    return {
      position_offset: Math.round(offset),
      progress_percent: progress,
    }
  }, [articleRef])

  useEffect(() => {
    if (
      !user ||
      loading ||
      error ||
      !chapter ||
      !chapterId
    ) {
      return undefined
    }

    const saveProgress = () => {
      recordReadingProgress(
        chapterId,
        getReadingPosition(),
      ).catch(() => {})
    }

    const scheduleSave = () => {
      window.clearTimeout(timerRef.current)

      timerRef.current = window.setTimeout(
        saveProgress,
        700,
      )
    }

    const initialTimer = window.setTimeout(
      saveProgress,
      500,
    )

    window.addEventListener(
      'scroll',
      scheduleSave,
      { passive: true },
    )

    window.addEventListener(
      'resize',
      scheduleSave,
    )

    return () => {
      window.clearTimeout(initialTimer)
      window.clearTimeout(timerRef.current)

      window.removeEventListener(
        'scroll',
        scheduleSave,
      )

      window.removeEventListener(
        'resize',
        scheduleSave,
      )

      saveProgress()
    }
  }, [
    chapter,
    chapterId,
    error,
    getReadingPosition,
    loading,
    user,
  ])

  return {
    getReadingPosition,
  }
}