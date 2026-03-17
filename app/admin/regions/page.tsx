"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

interface Region { id: string; region_code: string; region_name: string; business_states: string; status: string; }

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState({ region_code: "", region_name: "", business_states: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const supabase = createClient();
    const { data } = await supabase.from("regions").select("*").order("region_code");
    if (data) setRegions(data);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      const { error } = await supabase.from("regions").update(form).eq("id", editing.id);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Region updated");
    } else {
      const { error } = await supabase.from("regions").insert(form);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Region added");
    }
    setShowModal(false);
    fetchData();
  }

  async function toggleStatus(r: Region) {
    const supabase = createClient();
    const { error } = await supabase.from("regions").update({ status: r.status === "active" ? "inactive" : "active" }).eq("id", r.id);
    if (error) { toast("error", error.message); return; }
    fetchData();
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-gray-900">Regions</h1>
        <Button onClick={() => { setEditing(null); setForm({ region_code: "", region_name: "", business_states: "" }); setShowModal(true); }}>Add region</Button>
      </div>
      <Table>
          <THead><tr><TH>Code</TH><TH>Name</TH><TH>States</TH><TH>Status</TH><TH>Actions</TH></tr></THead>
          <tbody>
            {regions.map((r) => (
              <TR key={r.id}>
                <TD className="font-mono">{r.region_code}</TD>
                <TD className="font-medium">{r.region_name}</TD>
                <TD>{r.business_states}</TD>
                <TD><Badge variant={r.status === "active" ? "success" : "error"}>{r.status}</Badge></TD>
                <TD>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(r); setForm({ region_code: r.region_code, region_name: r.region_name, business_states: r.business_states }); setShowModal(true); }} className="text-xs text-brand-500 hover:underline">Edit</button>
                    <button onClick={() => toggleStatus(r)} className="text-xs text-gray-500 hover:underline">{r.status === "active" ? "Deactivate" : "Activate"}</button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Region" : "Add Region"}>
        <div className="space-y-4">
          <Input label="Region Code" value={form.region_code} onChange={(e) => setForm({ ...form, region_code: e.target.value })} />
          <Input label="Region Name" value={form.region_name} onChange={(e) => setForm({ ...form, region_name: e.target.value })} />
          <Input label="Business States" value={form.business_states} onChange={(e) => setForm({ ...form, business_states: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
        </div>
      </Modal>
    </div>
  );
}
