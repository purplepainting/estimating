'use client'

import { useState, useEffect } from 'react'

export default function TestTab() {
  const [test, setTest] = useState('Hello')

  const testFunction = () => {
    console.log('Test function called')
  }

  useEffect(() => {
    testFunction()
  }, [])

  return (
    <div className="p-4">
      <h2>Test Tab - {test}</h2>
      <p>If you can see this without errors, the basic React hooks are working.</p>
    </div>
  )
}
