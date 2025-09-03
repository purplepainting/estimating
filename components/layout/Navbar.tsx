'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getUserRole } from '@/lib/supabase'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole()
          setUserRole(role)
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
      setIsLoading(false)
    }

    fetchUserRole()
  }, [user])

  if (!user) return null

  const isAdmin = userRole === 'ADMIN'
  const isEstimator = userRole === 'ADMIN' || userRole === 'ESTIMATOR'

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Estimating App v2
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>

            {isEstimator && (
              <>
                <Link 
                  href="/clients" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Clients
                </Link>
                <Link 
                  href="/estimates" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Estimates
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link 
                  href="/admin/users" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Users
                </Link>
                <Link 
                  href="/admin/pricing" 
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Pricing
                </Link>
              </>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              {!isLoading && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  userRole === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  userRole === 'ESTIMATOR' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userRole}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
