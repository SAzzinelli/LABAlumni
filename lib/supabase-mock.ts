// Mock Supabase client for development without Supabase configured
// This saves data to localStorage to test the UI

export interface MockUser {
  id: string
  email: string
  user_metadata?: {
    role?: string
    full_name?: string
  }
}

export interface MockAuthResponse {
  user: MockUser | null
  error: any | null
}

class MockSupabase {
  private users: Map<string, MockUser> = new Map()
  private currentUser: MockUser | null = null

  constructor() {
    // Load users from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('laba_mock_users')
      if (stored) {
        try {
          const users = JSON.parse(stored)
          users.forEach((u: MockUser) => this.users.set(u.id, u))
        } catch (e) {
          console.warn('Failed to load mock users:', e)
        }
      }
    }
  }

  private saveUsers() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('laba_mock_users', JSON.stringify(Array.from(this.users.values())))
    }
  }

  auth = {
    signUp: async ({ email, password, options }: any): Promise<MockAuthResponse> => {
      // Check if user exists
      const existing = Array.from(this.users.values()).find(u => u.email === email)
      if (existing) {
        return {
          user: null,
          error: { message: 'User already registered' }
        }
      }

      // Create mock user
      const newUser: MockUser = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        user_metadata: options?.data || {}
      }

      this.users.set(newUser.id, newUser)
      this.saveUsers()

      return {
        user: newUser,
        error: null
      }
    },

    signInWithPassword: async ({ email, password }: any): Promise<MockAuthResponse> => {
      const user = Array.from(this.users.values()).find(u => u.email === email)
      
      if (!user) {
        return {
          user: null,
          error: { message: 'Invalid email or password' }
        }
      }

      this.currentUser = user
      if (typeof window !== 'undefined') {
        localStorage.setItem('laba_current_user', JSON.stringify(user))
      }

      return {
        user,
        error: null
      }
    },

    signOut: async () => {
      this.currentUser = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('laba_current_user')
      }
      return { error: null }
    },

    getSession: async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('laba_current_user')
        if (stored) {
          try {
            const user = JSON.parse(stored)
            return {
              data: { session: { user } },
              error: null
            }
          } catch (e) {
            return { data: { session: null }, error: null }
          }
        }
      }
      return { data: { session: null }, error: null }
    }
  }

  from(table: string) {
    return {
      select: (columns: string) => ({
        eq: (col: string, value: any) => ({
          single: async () => {
            if (typeof window === 'undefined') return { data: null, error: { code: 'PGRST116' } }
            
            // Try to find by id first
            let key = `laba_${table}_${value}`
            let stored = localStorage.getItem(key)
            
            // If not found, search in list
            if (!stored) {
              const listKey = `laba_${table}_list`
              const list = JSON.parse(localStorage.getItem(listKey) || '[]')
              const found = list.find((item: any) => item[col] === value)
              if (found) {
                return { data: found, error: null }
              }
            } else {
              return { data: JSON.parse(stored), error: null }
            }
            
            return { data: null, error: { code: 'PGRST116' } }
          }
        })
      }),
      
      insert: async (data: any) => {
        if (typeof window === 'undefined') {
          return { error: null }
        }
        
        const key = `laba_${table}_${data.id}`
        localStorage.setItem(key, JSON.stringify(data))
        
        // Also update the list
        const listKey = `laba_${table}_list`
        const list = JSON.parse(localStorage.getItem(listKey) || '[]')
        // Remove if exists
        const filtered = list.filter((item: any) => item.id !== data.id)
        filtered.push(data)
        localStorage.setItem(listKey, JSON.stringify(filtered))
        
        return { error: null }
      },
      
      update: (data: any) => ({
        eq: (col: string, value: any) => ({
          then: async (callback: (result: { error: any }) => any) => {
            if (typeof window === 'undefined') {
              return callback({ error: null })
            }
            
            const key = `laba_${table}_${value}`
            const existing = localStorage.getItem(key)
            if (existing) {
              const existingData = JSON.parse(existing)
              const updated = { ...existingData, ...data, updated_at: new Date().toISOString() }
              localStorage.setItem(key, JSON.stringify(updated))
            }
            
            return callback({ error: null })
          }
        })
      })
    }
  }
}

export const mockSupabase = new MockSupabase()
