import * as React from "react";
import { createEmber } from "@/services/embers";
import { toast } from "@/hooks/use-toast";
import { Flame, Clock, Eye, EyeOff, Users } from "lucide-react";

export default function EmberComposer() {
  const [text, setText] = React.useState("");
  const [ttl, setTtl] = React.useState(48);
  const [visibility, setVisibility] = React.useState<"public"|"friends"|"private">("public");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await createEmber({ 
        content: text.trim(), 
        ttl_hours: ttl, 
        visibility 
      });
      setText("");
      toast({
        title: "Ember ignited! 🔥",
        description: "Your ember is now glowing in the feed"
      });
    } catch (error) {
      console.error('Error creating ember:', error);
      toast({
        title: "Error",
        description: "Failed to create ember. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBusy(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <Eye className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <EyeOff className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'friends': return 'Friends';
      case 'private': return 'Private';
    }
  };

  return (
    <div id="ember-composer" className="rounded-xl border border-emerald-900/35 bg-[#F8F6F2] p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-slate-800">Drop an Ember</h3>
      </div>
      
      <textarea
        rows={2}
        maxLength={280}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share a quick thought that will glow for a while..."
        className="w-full resize-none bg-transparent text-[15px] leading-6 text-slate-800 placeholder:text-slate-500 focus:outline-none"
      />
      
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {getVisibilityIcon()}
          <select 
            value={visibility} 
            onChange={(e) => setVisibility(e.target.value as "public" | "friends" | "private")} 
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Private</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-600" />
          <label className="text-sm text-slate-600">TTL</label>
          <input 
            type="number" 
            min={1} 
            max={168} 
            value={ttl} 
            onChange={(e) => setTtl(parseInt(e.target.value || "48"))}
            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-500">hours</span>
        </div>
        
        <div className="ml-auto text-xs text-slate-500">
          {text.length}/280
        </div>
        
        <button 
          onClick={submit} 
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Flame className="h-4 w-4" />
          {busy ? 'Igniting...' : 'Ignite'}
        </button>
      </div>
      
      <div className="mt-2 text-xs text-slate-500">
        <span className="font-medium">{getVisibilityLabel()}</span> • 
        Glows for <span className="font-medium">{ttl} hours</span> • 
        Press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">⌘+Enter</kbd> to ignite
      </div>
    </div>
  );
}
