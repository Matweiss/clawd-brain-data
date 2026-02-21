'use client'

import { useEffect, useState } from 'react'

export default function TestSupabase() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🎉 Supabase Connection Test</h1>
      
      <div className="bg-green-100 border border-green-400 rounded p-4 mb-4">
        <p className="font-semibold">✅ Connected to Supabase!</p>
        <p className="text-sm text-gray-700">Found {tasks.length} task(s)</p>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="border rounded p-4">
            <p className="font-semibold">{task.title}</p>
            <p className="text-sm text-gray-600">
              Status: {task.status} | Created by: {task.created_by}
            </p>
            <p className="text-xs text-gray-400">ID: {task.id}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
