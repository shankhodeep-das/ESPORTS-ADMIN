'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function ActivityLog({ matchId }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetchLogs()

    const channel = supabase
      .channel('logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs'
      }, () => {
        fetchLogs()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchLogs() {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(20)

    setLogs(data || [])
  }

  function getIcon(action) {
    switch(action) {
      case 'eliminated': return '🔴'
      case 'kill_added': return '🎯'
      case 'kill_removed': return '↩️'
      case 'revived': return '🟢'
      case 'team_added': return '➕'
      default: return '📝'
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {logs.length === 0 && (
        <p className="text-gray-400 p-4">No activity yet.</p>
      )}
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 last:border-0"
        >
          <span className="text-lg">{getIcon(log.action)}</span>
          <span className="text-sm text-gray-300 flex-1">{log.message}</span>
          <span className="text-xs text-gray-500">
            {new Date(log.created_at).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  )
}