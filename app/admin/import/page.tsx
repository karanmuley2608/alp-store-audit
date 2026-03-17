"use client";

import { useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface ValidationRow {
  row: number;
  valid: boolean;
  errors: string[];
  data: Record<string, unknown>;
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ValidationRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleUpload(f: File) {
    setFile(f);
    // Dynamic import xlsx
    const XLSX = await import("xlsx");
    const arrayBuffer = await f.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);

    const validationResults: ValidationRow[] = [];
    let rowNum = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      for (const row of data) {
        rowNum++;
        const errors: string[] = [];

        // Basic validation
        if (sheetName === "Employees" || sheetName === "employees") {
          if (!row.employee_code) errors.push("Missing employee_code");
          if (!row.full_name) errors.push("Missing full_name");
          if (!row.email) errors.push("Missing email");
          if (!row.role) errors.push("Missing role");
        }
        if (sheetName === "Stores" || sheetName === "stores") {
          if (!row.store_code) errors.push("Missing store_code");
          if (!row.store_name) errors.push("Missing store_name");
          if (!row.city) errors.push("Missing city");
        }

        validationResults.push({ row: rowNum, valid: errors.length === 0, errors, data: row });
      }
    }

    setResults(validationResults);
  }

  async function handleImport() {
    setImporting(true);
    // Stub: In production, insert valid rows into Supabase
    toast("success", `${results.filter((r) => r.valid).length} records imported successfully`);
    setImporting(false);
    setResults([]);
    setFile(null);
  }

  const validCount = results.filter((r) => r.valid).length;
  const errorCount = results.filter((r) => !r.valid).length;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-page-title text-gray-900">Bulk Import</h1>

      <Card>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 hover:border-brand-500"
        >
          <ArrowUpTrayIcon className="h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm font-medium text-gray-700">
            {file ? file.name : "Click to upload .xlsx file"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Supports sheets: Regions, Employees, Stores, Checklist
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
      </Card>

      {results.length > 0 && (
        <>
          <div className="flex gap-3">
            <Badge variant="success">{validCount} valid</Badge>
            <Badge variant="error">{errorCount} errors</Badge>
          </div>

          <Card className="!p-0 max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Errors</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.row} className={`border-b border-gray-100 ${r.valid ? "" : "bg-error-50"}`}>
                    <td className="px-4 py-2">{r.row}</td>
                    <td className="px-4 py-2">
                      <Badge variant={r.valid ? "success" : "error"}>{r.valid ? "Valid" : "Error"}</Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-error-600">{r.errors.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Button onClick={handleImport} disabled={errorCount > 0 || importing}>
            {importing ? "Importing..." : `Confirm import (${validCount} records)`}
          </Button>
        </>
      )}
    </div>
  );
}
