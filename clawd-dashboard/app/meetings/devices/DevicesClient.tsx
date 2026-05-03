"use client";

import { useEffect, useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import { StatusPill } from "@/app/components/ui/status-pill";

type Device = {
  device_id: string;
  device_label: string;
  last_seen: string;
  last_capture_ts: string | null;
  registered_at: string;
  stale: boolean;
};

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function DevicesClient() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/devices");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { devices: Device[] };
        if (!cancelled) {
          setDevices(data.devices);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  async function handleRotate(deviceId: string) {
    setRotating(deviceId);
    setRotateError(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}/rotate-key`, {
        method: "POST",
      });
      // 501 stub is the expected Phase 2 path — surface message inline
      const body = (await res.json()) as { message?: string; error?: string };
      setRotateError(body.message ?? body.error ?? `HTTP ${res.status}`);
    } catch (e) {
      setRotateError((e as Error).message);
    } finally {
      setRotating(null);
    }
  }

  if (error && !devices) {
    return (
      <div className="border border-status-blocked/40 bg-status-blocked/5 p-4 font-mono text-xs text-status-blocked">
        Load error: {error}
      </div>
    );
  }
  if (!devices) {
    return (
      <div className="py-10 font-mono text-xs text-bone-300">Loading…</div>
    );
  }
  if (devices.length === 0) {
    return (
      <div className="border hairline p-8 text-center">
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
          empty
        </div>
        <p className="mt-3 text-[14px] text-bone-200">
          No capture devices registered yet. Run{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-bone-100">
            install-mac-capture-agent.sh --setup
          </code>{" "}
          on a Mac to register.
        </p>
      </div>
    );
  }

  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between border-b hairline pb-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-capwide text-bone-300">
            registered devices
          </h2>
          <p className="mt-1 text-[12px] text-bone-400">
            Heartbeats poll every 5 minutes; chip flips to stale when a
            device has been silent for over 24 hours.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-capwide text-bone-500">
          {devices.length}{" "}
          {devices.length === 1 ? "device" : "devices"}
        </div>
      </header>

      {rotateError && (
        <div className="mb-4 border border-ember-500/30 bg-ember-500/5 px-4 py-3 font-mono text-[11px] text-ember-500">
          {rotateError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b hairline">
              <Th>Device</Th>
              <Th width="w-44">Status</Th>
              <Th align="right" width="w-28">
                Last seen
              </Th>
              <Th align="right" width="w-32">
                Last capture
              </Th>
              <Th align="right" width="w-28">
                Registered
              </Th>
              <Th align="right" width="w-32">
                Actions
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/60">
            {devices.map((d) => (
              <DeviceRow
                key={d.device_id}
                d={d}
                rotating={rotating === d.device_id}
                onRotate={() => handleRotate(d.device_id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeviceRow({
  d,
  rotating,
  onRotate,
}: {
  d: Device;
  rotating: boolean;
  onRotate: () => void;
}) {
  return (
    <tr className="text-[13px] text-bone-100 transition-colors hover:bg-ink-800/40">
      <td className="py-3 pr-4">
        <div className="text-bone-50">{d.device_label}</div>
        <div className="mt-1 font-mono text-[10px] text-bone-500">
          {d.device_id}
        </div>
      </td>
      <td className="py-3 pl-2 pr-2">
        {d.stale ? (
          <StatusPill label="stale > 24h" variant="blocked" />
        ) : (
          <StatusPill label="active" variant="open" dot />
        )}
      </td>
      <td className="py-3 pl-2 text-right font-mono text-[11px] text-bone-300">
        {timeAgo(d.last_seen)}
      </td>
      <td className="py-3 pl-2 text-right font-mono text-[11px] text-bone-300">
        {d.last_capture_ts ? (
          timeAgo(d.last_capture_ts)
        ) : (
          <span className="text-bone-500">—</span>
        )}
      </td>
      <td className="py-3 pl-2 text-right font-mono text-[11px] text-bone-300">
        {timeAgo(d.registered_at)}
      </td>
      <td className="py-3 pl-2 text-right">
        <button
          type="button"
          onClick={onRotate}
          disabled={rotating}
          title="Available in Phase 3"
          className={cn(
            "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-capwide transition-colors",
            "cursor-not-allowed border-ink-700 text-bone-500"
          )}
        >
          {rotating ? "Rotating…" : "Rotate key"}
        </button>
      </td>
    </tr>
  );
}

function Th({
  children,
  align,
  width,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  return (
    <th
      className={cn(
        "py-3 font-mono text-[10px] font-medium uppercase tracking-capwide text-bone-300",
        align === "right" ? "text-right" : "text-left",
        width
      )}
    >
      {children}
    </th>
  );
}
