import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getUserRole = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data ? data.role : null
}

export const isAdmin = async () => {
  const role = await getUserRole()
  return role === 'ADMIN'
}

export const isEstimator = async () => {
  const role = await getUserRole()
  return role === 'ADMIN' || role === 'ESTIMATOR'
}

export const canEdit = async () => {
  const role = await getUserRole()
  return role === 'ADMIN' || role === 'ESTIMATOR'
}

export const canView = async () => {
  const role = await getUserRole()
  return role === 'ADMIN' || role === 'ESTIMATOR' || role === 'VIEWER'
}
