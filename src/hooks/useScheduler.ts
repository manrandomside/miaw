import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useScheduler(dispatchAction: (endpoint: string, method: string) => Promise<void>) {
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch pending tasks where execute_at is in the past
      const { data, error } = await supabase
        .from('miaw_schedules')
        .select('*')
        .eq('status', 'pending')
        .lte('execute_at', new Date().toISOString())

      if (!error && data && data.length > 0) {
        for (const task of data) {
          try {
            await dispatchAction(task.endpoint, task.method)
            await supabase
              .from('miaw_schedules')
              .update({ status: 'done' })
              .eq('id', task.id)
          } catch (e) {
            console.error('Failed to execute scheduled task', e)
          }
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [dispatchAction])
}
