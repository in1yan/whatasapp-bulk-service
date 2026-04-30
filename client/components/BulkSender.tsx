"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Input";
import { Card } from "./ui/Tabs";

export const BulkSender = () => {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("Hello {Name}, your code is {Code}");
  const [delay, setDelay] = useState(3);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("template", template);
    formData.append("delay", delay.toString());

    try {
      const res = await fetch("/api/v1/bulk/send", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setJobId(data.job_id);
      } else {
        alert(data.detail || "Upload failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      const res = await fetch(`/api/v1/bulk/status/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
        }
      }
    };

    const interval = setInterval(poll, 2000);
    poll();
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold font-mono uppercase tracking-wider mb-6">New Bulk Job</h2>
        <form onSubmit={handleUpload} className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-mono text-mid-gray">CSV/Excel File</label>
              <button 
                type="button"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8,Name,Number,Code\nJohn Doe,1234567890,CODE123\nJane Smith,0987654321,PROMO456";
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "sample_contacts.csv");
                  document.body.appendChild(link);
                  link.click();
                }}
                className="text-[10px] text-accent-blue hover:underline font-mono"
              >
                DOWNLOAD_SAMPLE.CSV
              </button>
            </div>
            <div className="border-2 border-dashed border-border-warm rounded-[6px] p-8 text-center hover:border-accent-blue transition-colors cursor-pointer" 
                 onClick={() => document.getElementById('file-upload')?.click()}>
              <input 
                id="file-upload"
                type="file" 
                className="hidden" 
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="text-mid-gray font-mono text-sm">
                {file ? file.name : "Click to upload contacts list"}
              </div>
            </div>

          <div className="space-y-2">
            <label className="text-sm font-mono text-mid-gray">Message Template</label>
            <Textarea 
              placeholder="Hello {Name}, welcome to {Company}!" 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="text-[10px] font-mono text-mid-gray">Use {"{ColumnName}"} to inject variables from your file.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-mono text-mid-gray">Delay between messages (seconds)</label>
            <Input 
              type="number" 
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              min={1}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading || !file}>
            {loading ? "Initializing..." : "Start Bulk Broadcast"}
          </Button>
        </form>
      </Card>

      {jobId && status && (
        <Card className="border-accent-blue/50">
          <h2 className="text-lg font-bold font-mono uppercase tracking-wider mb-4 flex justify-between">
            Job Progress
            <span className="text-accent-blue">{status.status.toUpperCase()}</span>
          </h2>
          
          <div className="space-y-4">
            <div className="w-full bg-dark-surface h-2 rounded-full overflow-hidden">
              <div 
                className="bg-accent-blue h-full transition-all duration-500" 
                style={{ width: `${(status.processed / status.total) * 100 || 0}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center font-mono text-sm">
              <div>
                <div className="text-mid-gray text-[10px] uppercase">Processed</div>
                <div className="text-xl font-bold">{status.processed} / {status.total}</div>
              </div>
              <div>
                <div className="text-success-green text-[10px] uppercase">Sent</div>
                <div className="text-xl font-bold text-success-green">{status.sent}</div>
              </div>
              <div>
                <div className="text-danger-red text-[10px] uppercase">Failed</div>
                <div className="text-xl font-bold text-danger-red">{status.failed}</div>
              </div>
            </div>

            {status.status === "completed" && (
              <Button 
                onClick={() => window.open(`/api/v1/bulk/download/${jobId}`)}
                variant="success" 
                className="w-full mt-4"
              >
                Download Detailed Report
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
