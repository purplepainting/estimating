'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { Navbar } from '@/components/layout/Navbar'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    )
  }

  // User is logged in, show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Estimating App v2
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Professional estimating for construction and painting projects
          </p>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/clients" 
                className="p-4 border rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-lg mb-2">📋 Clients & Projects</h3>
                <p className="text-gray-600">Manage your clients and project information</p>
              </a>
              <a 
                href="/estimates" 
                className="p-4 border rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-lg mb-2">📐 Create Estimates</h3>
                <p className="text-gray-600">Build detailed estimates with auto-calculations</p>
              </a>
              <a 
                href="/admin/users" 
                className="p-4 border rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
              >
                <h3 className="font-semibold text-lg mb-2">👥 User Management</h3>
                <p className="text-gray-600">Manage users and permissions (Admin only)</p>
              </a>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Logged in as: {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
