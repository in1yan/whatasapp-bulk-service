"use client";

import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Input";
import { Card } from "./ui/Tabs";

export const SingleSender = () => {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/v1/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, text: message }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: "Message sent successfully!" });
        setNumber("");
        setMessage("");
      } else {
        setStatus({ type: "error", msg: data.detail || "Failed to send message" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold font-mono uppercase tracking-wider mb-6">Send Direct Message</h2>
      <form onSubmit={handleSend} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-mono text-mid-gray">Phone Number (with country code)</label>
          <Input 
            placeholder="e.g. 1234567890" 
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-mono text-mid-gray">Message Body</label>
          <Textarea 
            placeholder="Type your message here..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {status && (
          <div className={`p-4 rounded-[4px] font-mono text-sm ${
            status.type === "success" ? "bg-success-green/20 text-success-green" : "bg-danger-red/20 text-danger-red"
          }`}>
            {status.msg}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Card>
  );
};
