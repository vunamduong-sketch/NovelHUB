import { api } from './client.js'

export const summarizeChapterContent = async (novelId, content) => {
  const response = await api.post(`/ai/novels/${novelId}/summarize`, { content })
  return response.data.summary
}

export const suggestChapterTitle = async (novelId, content) => {
  const response = await api.post(`/ai/novels/${novelId}/suggest-title`, { content })
  return response.data.suggested_titles
}

export const checkChapterGrammar = async (novelId, content) => {
  const response = await api.post(`/ai/novels/${novelId}/check-grammar`, { content })
  return response.data.suggestions
}

export const suggestWriting = async (novelId, content, prompt) => {
  const response = await api.post(`/ai/novels/${novelId}/suggest-writing`, { content, prompt })
  return response.data.suggestion
}
