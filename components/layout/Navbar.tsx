'use client'

import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function Navbar() {
  // Show all navigation without authentication checks for testing
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
            {/* Navigation Links - All accessible for testing */}
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>

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

            {/* User Info - Testing mode */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                test@example.com
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                TESTING
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

