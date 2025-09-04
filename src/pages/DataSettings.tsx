import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function DataSettings() {
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState<string | undefined>()

  async function doExport() {
    setBusy(true)
    try {
      // Data export functionality disabled for now
      // TODO: Implement data export with Supabase Edge Function if needed
      alert('Data export is not available at this time')
    } catch {
      alert('Export failed')
    }
    setBusy(false)
  }

  async function doImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const text = (form.elements.namedItem('payload') as HTMLTextAreaElement)?.value.trim()
    if (!text) return
    try {
      // Data import functionality disabled for now
      // TODO: Implement data import with Supabase Edge Function if needed
      alert('Data import is not available at this time')
    } catch {
      alert('Import failed')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <div className="text-lg font-semibold">Your Data</div>
        <div className="text-sm text-white/70">Export or import your content and relationships.</div>
      </div>
      <div className="rounded-lg border border-white/10 p-4">
        <button
          disabled={busy}
          onClick={doExport}
          className="h-9 px-3 rounded bg-background-sand text-black text-sm"
        >
          {busy ? 'Preparing…' : 'Export my data'}
        </button>
        {url && (
          <a href={url} className="ml-3 underline text-sm" target="_blank" rel="noopener noreferrer">
            Download
          </a>
        )}
      </div>
      <form onSubmit={doImport} className="rounded-lg border border-white/10 p-4 space-y-2">
        <div className="text-sm font-semibold">Import (JSON)</div>
        <textarea
          name="payload"
          rows={6}
          className="w-full rounded bg-white/5 p-2 text-sm"
          placeholder='{"posts":[...],"follows":[...],"profile":{...}}'
        />
        <button className="h-9 px-3 rounded bg-white/10 text-sm">Import</button>
      </form>
    </div>
  )
}

