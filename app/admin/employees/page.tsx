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

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  mobile: string;
  role: string;
  store_codes: string[];
  region_id: string | null;
  status: string;
}

interface Region {
  id: string;
  region_name: string;
}

const roles = ["NSO Head", "SM", "DM", "CM", "EPC", "FM", "Admin"];

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ employee_code: "", full_name: "", email: "", mobile: "", role: "SM", store_codes: "", region_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    const { data: emps } = await supabase.from("employees").select("*").order("employee_code");
    const { data: regs } = await supabase.from("regions").select("id, region_name");
    if (emps) setEmployees(emps);
    if (regs) setRegions(regs);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ employee_code: "", full_name: "", email: "", mobile: "", role: "SM", store_codes: "", region_id: "" });
    setShowModal(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      email: emp.email,
      mobile: emp.mobile,
      role: emp.role,
      store_codes: emp.store_codes?.join(", ") || "",
      region_id: emp.region_id || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const data = {
      employee_code: form.employee_code,
      full_name: form.full_name,
      email: form.email,
      mobile: form.mobile,
      role: form.role,
      store_codes: form.store_codes ? form.store_codes.split(",").map((s) => s.trim()) : [],
      region_id: form.region_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("employees").update(data).eq("id", editing.id);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Employee updated");
    } else {
      const { error } = await supabase.from("employees").insert(data);
      setSaving(false);
      if (error) { toast("error", error.message); return; }
      toast("success", "Employee added");
    }

    setShowModal(false);
    fetchData();
  }

  async function toggleStatus(emp: Employee) {
    const supabase = createClient();
    const { error } = await supabase.from("employees").update({ status: emp.status === "active" ? "inactive" : "active" }).eq("id", emp.id);
    if (error) { toast("error", error.message); return; }
    fetchData();
  }

  const filtered = employees.filter((e) =>
    !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title text-gray-900">Employees</h1>
        <Button onClick={openAdd}>Add employee</Button>
      </div>

      <input
        type="text"
        placeholder="Search employees..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 w-80 rounded-lg border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
      />

      <Card className="!p-0 overflow-hidden">
        <Table>
          <THead>
            <tr>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Mobile</TH>
              <TH>Role</TH>
              <TH>Store Codes</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.map((emp) => (
              <TR key={emp.id}>
                <TD className="font-mono">{emp.employee_code}</TD>
                <TD className="font-medium">{emp.full_name}</TD>
                <TD>{emp.email}</TD>
                <TD>{emp.mobile}</TD>
                <TD><Badge variant="info">{emp.role}</Badge></TD>
                <TD>{emp.store_codes?.join(", ") || "—"}</TD>
                <TD>
                  <Badge variant={emp.status === "active" ? "success" : "error"}>
                    {emp.status}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(emp)} className="text-xs text-brand-500 hover:underline">Edit</button>
                    <button onClick={() => toggleStatus(emp)} className="text-xs text-gray-500 hover:underline">
                      {emp.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => toast("info", "Password reset email sent")} className="text-xs text-gray-500 hover:underline">Reset pwd</button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Employee" : "Add Employee"} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Employee Code" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-500">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-gray-500">Region</label>
            <select value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })} className="h-11 rounded-lg border border-gray-200 px-3 text-sm">
              <option value="">Select region</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.region_name}</option>)}
            </select>
          </div>
          {form.role === "SM" && (
            <Input label="Store Codes (comma-separated)" value={form.store_codes} onChange={(e) => setForm({ ...form, store_codes: e.target.value })} className="col-span-2" />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
        </div>
      </Modal>
    </div>
  );
}
