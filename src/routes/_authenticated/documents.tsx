import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DOC_TYPES, DOC_TYPE_LABELS } from "@/lib/catalyst";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  component: Documents,
});

const VIS = [
  { v: "private", label: "Private" },
  { v: "matches", label: "Matches only" },
  { v: "everyone", label: "Everyone" },
  { v: "send_only", label: "Send only" },
] as const;

function Documents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [docType, setDocType] = useState<string>("pitch_deck");
  const [visibility, setVisibility] = useState<string>("matches");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["docs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("documents").insert({
        owner_id: user.id,
        name: name || file.name,
        doc_type: docType,
        file_path: path,
        visibility: visibility as never,
      });
      if (error) throw error;
      toast.success("Uploaded");
      setName(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["docs", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setBusy(false); }
  };

  const remove = async (id: string, path: string) => {
    await supabase.storage.from("documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["docs", user!.id] });
  };

  const download = async (path: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const input = "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload pitch decks, one-pagers, and other files. Send them directly through chat.</p>
      </div>

      <form onSubmit={upload} className="tile space-y-3 rounded-xl p-6">
        <h2 className="font-display text-lg font-bold">Upload</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className={input} placeholder="Document name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={input} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
          </select>
          <select className={input} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {VIS.map(v => <option key={v.v} value={v.v}>{v.label}</option>)}
          </select>
          <input className={input + " py-2"} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <button disabled={busy || !file} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      <div className="tile rounded-xl">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Your files</h2>
        </div>
        {!data?.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <ul>
            {data.map(d => (
              <li key={d.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="mono-label mt-0.5">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type} · {d.visibility}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => download(d.file_path)} className="text-xs font-bold text-primary hover:underline">Download</button>
                  <button onClick={() => remove(d.id, d.file_path)} className="text-xs font-bold text-destructive hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
