import { useCallback } from 'react'

export const useAuthToken = () => {
  const getToken = useCallback((): string | null => {
    return localStorage.getItem('auth_token')
  }, [])

  const setToken = useCallback((token: string) => {
    localStorage.setItem('auth_token', token)
  }, [])

  const removeToken = useCallback(() => {
    localStorage.removeItem('auth_token')
  }, [])

  const isAuthenticated = useCallback((): boolean => {
    return !!getToken()
  }, [getToken])

  return {
    getToken,
    setToken,
    removeToken,
    isAuthenticated
  }
}
