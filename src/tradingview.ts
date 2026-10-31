// Copied from 0xkaz/2026-macro-monitor src/tradingview.ts (proven there in production): AR reads its index, MSCI MERVAL
// (BCBA:MMSCI), from TradingView because Yahoo has no history for it (S&P MERVAL ended 2026-10-16, MSCI took over 10-19).
// TradingView daily bars over the public chart WebSocket (anonymous, delayed feed).
//
// Daily bar timestamps are the *session open*. Many macro instruments trade an overnight
// session (FX 17:00–17:00 New York, Treasuries 19:00–17:30, gold 18:00–17:00, FX_IDC
// 22:00–22:00 UTC), so Friday's bar is stamped Thursday evening. A bar whose open is at or
// after 12:00 in the instrument's own timezone is therefore dated the next calendar day.

export interface Bar { date: string; open: number; high: number; low: number; close: number }
export interface TvMeta { description?: string; currency_code?: string; timezone?: string; session?: string; type?: string }

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

function frame(method: string, params: unknown[]): string {
  const s = JSON.stringify({ m: method, p: params });
  return `~m~${s.length}~m~${s}`;
}
function rand(len = 12): string {
  const a = "abcdefghijklmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < len; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
const round = (v: number) => Math.round(v * 1e6) / 1e6;

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function localParts(ts: number, tz: string): { y: number; m: number; d: number; h: number } {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
    fmtCache.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ts * 1000))) p[x.type] = x.value;
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour) };
}

// Trading date of a daily bar: local date of the session open, +1 day for evening opens.
export function tradingDate(ts: number, tz: string): string {
  let parts: { y: number; m: number; d: number; h: number };
  try { parts = localParts(ts, tz || "Etc/UTC"); } catch { parts = localParts(ts, "Etc/UTC"); }
  const base = Date.UTC(parts.y, parts.m - 1, parts.d) + (parts.h >= 12 ? 86400000 : 0);
  return new Date(base).toISOString().slice(0, 10);
}

export async function fetchHistory(symbol: string, bars = 600, timeoutMs = 20000): Promise<{ meta: TvMeta; bars: Bar[] }> {
  const res = await fetch("https://data.tradingview.com/socket.io/websocket?from=chart%2F&type=chart", {
    headers: { Upgrade: "websocket", Origin: "https://www.tradingview.com", "User-Agent": UA },
  });
  const ws = (res as any).webSocket as WebSocket | null;
  if (!ws) throw new Error(`tradingview ws ${symbol}: HTTP ${res.status}`);
  ws.accept();

  const cs = `cs_${rand()}`;
  const rows: number[][] = [];
  let meta: TvMeta = {};

  return await new Promise<{ meta: TvMeta; bars: Bar[] }>((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`tradingview ws ${symbol}: timeout`)); }, timeoutMs);
    const cleanup = () => { clearTimeout(timer); try { ws.close(); } catch {} };
    const finish = () => {
      cleanup();
      const tz = meta.timezone ?? "Etc/UTC";
      const byDate = new Map<string, Bar>();
      for (const v of rows) {
        const [t, o, h, l, c] = v;
        if (c == null || !isFinite(c)) continue;
        const date = tradingDate(t, tz);
        byDate.set(date, { date, open: round(o ?? c), high: round(h ?? c), low: round(l ?? c), close: round(c) });
      }
      resolve({ meta, bars: [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1)) });
    };
    ws.addEventListener("message", (ev: MessageEvent) => {
      const raw = typeof ev.data === "string" ? ev.data : "";
      for (const part of raw.split(/~m~\d+~m~/)) {
        if (!part) continue;
        if (part.startsWith("~h~")) { ws.send(`~m~${part.length}~m~${part}`); continue; }
        let d: any;
        try { d = JSON.parse(part); } catch { continue; }
        switch (d?.m) {
          case "symbol_resolved": meta = d.p?.[2] ?? {}; break;
          case "timescale_update":
          case "du": {
            const s = d.p?.[1]?.s1?.s;
            if (Array.isArray(s)) for (const x of s) if (Array.isArray(x?.v)) rows.push(x.v);
            break;
          }
          case "series_completed": finish(); break;
          case "symbol_error": cleanup(); reject(new Error(`tradingview ws ${symbol}: ${d.p?.[2] ?? "symbol error"}`)); break;
          case "critical_error":
          case "protocol_error": cleanup(); reject(new Error(`tradingview ws ${symbol}: ${d.m}`)); break;
        }
      }
    });
    ws.addEventListener("error", () => { cleanup(); reject(new Error(`tradingview ws ${symbol}: socket error`)); });
    ws.addEventListener("close", () => { if (rows.length) finish(); else { cleanup(); reject(new Error(`tradingview ws ${symbol}: closed`)); } });

    ws.send(frame("set_auth_token", ["unauthorized_user_token"]));
    ws.send(frame("chart_create_session", [cs, ""]));
    ws.send(frame("resolve_symbol", [cs, "sym1", `={"symbol":"${symbol}","adjustment":"splits","session":"regular"}`]));
    ws.send(frame("create_series", [cs, "s1", "s1", "sym1", "1D", bars, ""]));
  });
}
