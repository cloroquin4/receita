// Cliente de API centralizado com tratamento robusto de erros
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

interface ApiError {
  message: string
  status?: number
  details?: any
}

class ApiClient {
  private timeout = 30000 // 30 segundos
  private maxRetries = 2

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Se for 401 (Unauthorized), fazer logout automático
    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Sessão expirada. Por favor, faça login novamente.')
    }

    // Se for 204 (No Content), retornar vazio
    if (response.status === 204) {
      return {} as T
    }

    // Tentar parsear a resposta como JSON
    let data: any
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (error) {
      throw new Error('Resposta inválida do servidor')
    }

    // Se a resposta não for OK, lançar erro com mensagem do backend
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Erro ${response.status}: ${response.statusText}`
      const apiError: ApiError = {
        message: errorMessage,
        status: response.status,
        details: data
      }
      throw apiError
    }

    return data
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout = this.timeout
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Requisição excedeu o tempo limite')
      }
      throw error
    }
  }

  private async fetchWithRetry<T>(
    url: string, 
    options: RequestInit,
    retries = this.maxRetries
  ): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options)
        return await this.handleResponse<T>(response)
      } catch (error: any) {
        // Se for o último retry ou erro não for de rede, lançar erro
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                               error.message?.includes('NetworkError') ||
                               error.message?.includes('tempo limite')
        
        const shouldRetry = i < retries && isNetworkError
        
        if (!shouldRetry) {
          // Se for erro da API com status e mensagem, lançar como está
          if (error.status || error.message) {
            throw error
          }
          // Se for erro de rede genérico
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.')
        }
        
        // Aguardar antes de tentar novamente (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
    
    throw new Error('Falha na requisição após múltiplas tentativas')
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }

  // Método para upload de arquivos (FormData)
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Não definir Content-Type para FormData - o browser faz automaticamente
    return this.fetchWithRetry<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })
  }

  // Método para fazer download de arquivos
  async downloadFile(endpoint: string, filename: string): Promise<void> {
    const response = await this.fetchWithTimeout(
      `${API_BASE_URL}${endpoint}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    )

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export const apiClient = new ApiClient()