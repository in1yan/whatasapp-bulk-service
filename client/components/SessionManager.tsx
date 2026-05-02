"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Tabs";

type SessionStatus =
  | "WORKING"
  | "SCAN_QR_CODE"
  | "STARTING"
  | "FAILED"
  | "STOPPED"
  | null;

export const SessionManager = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR state
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Me / profile state
  const [me, setMe] = useState<any>(null);

  // Screenshot state
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [screenshotTs, setScreenshotTs] = useState<string | null>(null);

  const status: SessionStatus = session?.status ?? null;
  const isConnected = status === "WORKING";

  // ── Session fetch ─────────────────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/whatsapp/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setError(null);
      } else {
        const errData = await res
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        setError(errData.detail || "Failed to fetch session");
        setSession(null);
      }
    } catch (err) {
      setError("Backend unreachable");
      setSession(null);
      console.error("Failed to fetch session", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── QR code fetch ─────────────────────────────────────────────────────────
  const refreshQR = useCallback(async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch("/api/v1/whatsapp/qr?t=" + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setQrSrc(URL.createObjectURL(blob));
    } catch (e: any) {
      setQrError("Could not load QR code. Is WAHA running?");
      setQrSrc(null);
    } finally {
      setQrLoading(false);
    }
  }, []);

  // ── /me fetch (profile picture + name) ───────────────────────────────────
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/whatsapp/me");
      if (res.ok) {
        const data = await res.json();
        setMe(data);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    }
  }, []);

  // ── Screenshot fetch ──────────────────────────────────────────────────────
  const refreshScreenshot = useCallback(async () => {
    setScreenshotLoading(true);
    setScreenshotError(null);
    try {
      const res = await fetch("/api/v1/whatsapp/screenshot?t=" + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setScreenshotSrc(URL.createObjectURL(blob));
      setScreenshotTs(new Date().toLocaleTimeString());
    } catch (e: any) {
      setScreenshotError("Could not capture screenshot. Is WAHA running?");
      setScreenshotSrc(null);
    } finally {
      setScreenshotLoading(false);
    }
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch("/api/v1/whatsapp/logout", { method: "POST" });
    fetchSession();
  };

  const handleRestart = async () => {
    await fetch("/api/v1/whatsapp/restart", { method: "POST" });
    setTimeout(fetchSession, 2000);
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 10000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // When not connected → load QR; when connected → load /me profile
  useEffect(() => {
    if (!loading) {
      if (isConnected) {
        fetchMe();
      } else {
        refreshQR();
        setMe(null);
      }
    }
    // Revoke stale object URL on cleanup
    return () => {
      if (qrSrc) URL.revokeObjectURL(qrSrc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isConnected]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusLabel = status ?? (error ? "OFFLINE" : "UNKNOWN");
  const statusColor =
    status === "WORKING"
      ? "bg-success-green text-background"
      : status === "STARTING"
        ? "bg-warning-orange text-background"
        : "bg-danger-red text-background";

  if (loading)
    return (
      <div className="text-mid-gray font-mono animate-pulse">
        Initialising terminal...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Session Status Card ─────────────────────────────────────────── */}
      <Card>
        {error && (
          <div className="mb-4 p-3 bg-danger-red/10 border border-danger-red/20 text-danger-red rounded-[4px] text-xs font-mono">
            [ERROR] {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold font-mono uppercase tracking-wider">
            Session Status
          </h2>
          <div
            className={`px-3 py-1 rounded-[4px] text-xs font-bold uppercase ${statusColor}`}
          >
            {statusLabel}
          </div>
        </div>

        {/* ── QR Login (shown ONLY when status is SCAN_QR) ─────────────────── */}
        {status === "SCAN_QR_CODE" && (
          <div className="mb-6">
            <p className="text-xs text-mid-gray font-mono mb-3 uppercase tracking-wider">
              [SCAN QR TO AUTHENTICATE]
            </p>
            <div className="flex flex-col items-center p-8 bg-white rounded-[6px] max-w-xs">
              {qrLoading && (
                <div className="w-48 h-48 flex items-center justify-center text-background font-mono text-xs">
                  Loading QR...
                </div>
              )}
              {qrError && !qrLoading && (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-danger-red font-mono text-xs text-center gap-2">
                  <span>[ERR]</span>
                  <span>{qrError}</span>
                </div>
              )}
              {qrSrc && !qrLoading && (
                <img
                  src={qrSrc}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 object-contain"
                />
              )}
              <p className="mt-3 text-background font-mono text-xs text-center">
                Open WhatsApp → Linked Devices → Link a Device
              </p>
              <Button
                onClick={refreshQR}
                variant="secondary"
                className="mt-3 text-xs"
              >
                ↻ Refresh QR
              </Button>
            </div>
          </div>
        )}

        {/* ── Starting Animation (shown when status is STARTING) ─────────── */}
        {status === "STARTING" && (
          <div className="mb-6 py-12 flex flex-col items-center justify-center border border-dashed border-border-warm rounded-[6px]">
            <div className="loader mb-6"></div>
            <p className="text-sm font-mono text-success-green animate-pulse uppercase tracking-widest">
              [INITIALIZING SESSION...]
            </p>
            <p className="text-[10px] font-mono text-mid-gray mt-2">
              Waiting for WhatsApp engine to start
            </p>
          </div>
        )}

        {/* ── Connected info ───────────────────────────────────────────── */}
        {isConnected && (
          <div className="flex gap-6 items-start mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {me?.picture ? (
                <img
                  src={me.picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-success-green"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-dark-surface border-2 border-border-gray flex items-center justify-center text-mid-gray font-mono text-2xl">
                  {(me?.pushName ??
                    session?.me?.pushName ??
                    "?")[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="font-mono text-sm space-y-2 flex-1">
              <div className="flex gap-2 items-baseline">
                <span className="text-mid-gray text-xs uppercase tracking-wider">
                  Name
                </span>
                <span className="font-semibold">
                  {me?.pushName ?? session?.me?.pushName ?? "—"}
                </span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="text-mid-gray text-xs uppercase tracking-wider">
                  Number
                </span>
                <span>{me?.id ?? session?.me?.id ?? "—"}</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="text-mid-gray text-xs uppercase tracking-wider">
                  Session
                </span>
                <span>{session?.name || "default"}</span>
              </div>
              <div className="flex gap-2 items-baseline">
                <span className="text-mid-gray text-xs uppercase tracking-wider">
                  Status
                </span>
                <span className="text-success-green font-bold">{status}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div className="flex gap-4 pt-2 border-t border-border-warm">
          <Button onClick={handleRestart} variant="secondary">
            ↺ Restart Session
          </Button>
          <Button onClick={handleLogout} variant="danger">
            ⏏ Logout
          </Button>
        </div>
      </Card>

      {/* ── Screenshot Panel ────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-mono uppercase tracking-wider">
            WhatsApp Screenshot
          </h2>
          <div className="flex items-center gap-3">
            {screenshotTs && (
              <span className="text-xs text-mid-gray font-mono">
                Last: {screenshotTs}
              </span>
            )}
            <Button
              onClick={refreshScreenshot}
              variant="secondary"
              className="text-xs"
            >
              {screenshotLoading ? "Capturing…" : "↻ Capture"}
            </Button>
          </div>
        </div>

        {screenshotError && (
          <div className="p-3 bg-danger-red/10 border border-danger-red/20 text-danger-red rounded-[4px] text-xs font-mono mb-4">
            [ERROR] {screenshotError}
          </div>
        )}

        {!screenshotSrc && !screenshotLoading && !screenshotError && (
          <div className="h-48 flex items-center justify-center border border-dashed border-border-gray rounded-[4px] text-mid-gray font-mono text-xs">
            Click &quot;Capture&quot; to take a screenshot of the current
            WhatsApp Web state
          </div>
        )}

        {screenshotLoading && (
          <div className="h-48 flex items-center justify-center border border-border-warm rounded-[4px] text-mid-gray font-mono text-xs animate-pulse">
            [CAPTURING SCREENSHOT...]
          </div>
        )}

        {screenshotSrc && !screenshotLoading && (
          <div className="rounded-[4px] overflow-hidden border border-border-warm">
            <img
              src={screenshotSrc}
              alt="WhatsApp Web Screenshot"
              className="w-full object-contain"
            />
          </div>
        )}
      </Card>

      {/* ── Instance Logs ────────────────────────────────────────────────────── */}
      {/*<Card>
        <h2 className="text-lg font-bold font-mono uppercase tracking-wider mb-4">
          Instance Logs
        </h2>
        <div className="bg-dark-surface p-4 rounded-[4px] h-48 overflow-y-auto font-mono text-xs text-mid-gray space-y-1">
          <div>[INFO] {new Date().toISOString()} — WhatsApp service initialized</div>
          <div>[INFO] {new Date().toISOString()} — Ready for commands</div>
          {error && (
            <div className="text-danger-red">[ERROR] {error}</div>
          )}
          {status === "WORKING" && (
            <div className="text-success-green">[SUCCESS] WhatsApp session connected</div>
          )}
          {status === "SCAN_QR" && (
            <div className="text-warning-orange">[WAITING] Awaiting QR scan…</div>
          )}
          {status === "STARTING" && (
            <div className="text-warning-orange">[INFO] Session is starting…</div>
          )}
          {status === "FAILED" && (
            <div className="text-danger-red">[FAILED] Session failed to start</div>
          )}
        </div>
      </Card>*/}
    </div>
  );
};
