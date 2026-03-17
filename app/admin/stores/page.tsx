"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { Table, THead, TH, TD, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

interface Store {
  id: string;
  store_code: string;
  store_name: string;
  address: string;
  city: string;
  state: string;
  store_type: string;
  target_completion_date: string;
  status: string;
  assigned_sm_id: string | null;
  assigned_nso_id: string | null;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState({ store_code: "", store_name: "", address: "", city: "", state: "", store_type: "Standard", target_completion_date: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const supabase = createClient();
    const { data } = await supabase.from("stores").select("*").order("store_code");
    if (data) setStores(data);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ store_code: "", store_name: "", address: "", city: "", state: "", store_type: "Standard", target_completion_date: "" });
    setShowModal(true);
  }

  function openEdit(s: Store) {
    setEditing(s);
    setForm({ store_code: s.store_code, store_name: s.store_name, address: s.address || "", city: s.city, state: s.state, store_type: s.store_type, target_completion_date: s.target_completion_date || "" });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const data = { store_code: form.store_code, store_name: form.store_name, address: form.address, city: form.city, state: form.state, store_type: form.store_type, target_completion_date: form.target_completion_date || null };

    if (editing) {
      const { error } = await supabase.from("stores").update(data).eq("id", editing.id);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Store updated");
    } else {
      const { error } = await supabase.from("stores").insert(data);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Store added");
    }
    setShowModal(false);
    fetchData();
  }

  async function toggleStatus(s: Store) {
    const supabase = createClient();
    const { error } = await supabase.from("stores").update({ status: s.status === "active" ? "inactive" : "active" }).eq("id", s.id);
    if (error) { toast("error", error.message); return; }
    fetchData();
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-gray-900">Stores</h1>
        <Button onClick={openAdd}>Add store</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <Table>
          <THead>
            <tr><TH>Code</TH><TH>Name</TH><TH>City</TH><TH>State</TH><TH>Type</TH><TH>Target</TH><TH>Status</TH><TH>Actions</TH></tr>
          </THead>
          <tbody>
            {stores.map((s) => (
              <TR key={s.id}>
                <TD className="font-mono">{s.store_code}</TD>
                <TD className="font-medium">{s.store_name}</TD>
                <TD>{s.city}</TD>
                <TD>{s.state}</TD>
                <TD><Badge variant="neutral">{s.store_type}</Badge></TD>
                <TD>{s.target_completion_date || "—"}</TD>
                <TD><Badge variant={s.status === "active" ? "success" : "error"}>{s.status}</Badge></TD>
                <TD>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-xs text-brand-500 hover:underline">Edit</button>
                    <button onClick={() => toggleStatus(s)} className="text-xs text-gray-500 hover:underline">{s.status === "active" ? "Deactivate" : "Activate"}</button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Store" : "Add Store"}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Store Code" value={form.store_code} onChange={(e) => setForm({ ...form, store_code: e.target.value })} />
          <Input label="Store Name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2" />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-500">Type</label>
            <select value={form.store_type} onChange={(e) => setForm({ ...form, store_type: e.target.value })} className="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option>Standard</option><option>Large</option><option>Flagship</option>
            </select>
          </div>
          <Input label="Target Date" type="date" value={form.target_completion_date} onChange={(e) => setForm({ ...form, target_completion_date: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
        </div>
      </Modal>
    </div>
  );
}
