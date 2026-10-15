// Tracked universe for AR Equity Monitor: S&P MERVAL + liquid BYMA names.
// code = BYMA stock code (Yahoo symbol is `${code}.BA`). Names are refreshed from Yahoo;
// the comments here are hints for readability only.
export interface UniverseEntry {
  code: string;
  sector: Sector;
  kind?: "equity" | "index";
  name?: string;
}

export type Sector =
  | "Banking" | "Financials" | "Energy" | "Materials" | "Telecom" | "Staples" | "Consumer" | "Industrial" | "Property" | "Index";

export const INDEX_SYMBOL = "^MERV";
export const INDEX_CODE = "MERVAL";
export const EXCHANGE_SUFFIX = ".BA";

export const UNIVERSE: UniverseEntry[] = [
  { code: "MERVAL", sector: "Index", kind: "index", name: "S&P MERVAL" },
  // Banking
  { code: "GGAL", sector: "Banking" }, // Grupo Financiero Galicia S.A.
  { code: "BMA", sector: "Banking" }, // Banco Macro S.A.
  { code: "BBAR", sector: "Banking" }, // Banco BBVA Argentina S.A.
  { code: "SUPV", sector: "Banking" }, // Grupo Supervielle S.A.
  { code: "VALO", sector: "Banking" }, // Banco de Valores S.A.
  // Financials
  { code: "BYMA", sector: "Financials" }, // Bolsas y Mercados Argentinos S.A.
  // Energy
  { code: "YPFD", sector: "Energy" }, // YPF Sociedad Anónima
  { code: "PAMP", sector: "Energy" }, // Pampa Energía S.A.
  { code: "CEPU", sector: "Energy" }, // Central Puerto S.A.
  { code: "TGSU2", sector: "Energy" }, // Transportadora de Gas del Sur S.A.
  { code: "TGNO4", sector: "Energy" }, // Transportadora de Gas del Norte S.A.
  { code: "TRAN", sector: "Energy" }, // Compañía de Transporte de Energía Eléctrica en Alta Tensión Transener S.A.
  { code: "EDN", sector: "Energy" }, // Empresa Distribuidora y Comercializadora Norte Sociedad Anónima
  // Materials
  { code: "ALUA", sector: "Materials" }, // Aluar Aluminio Argentino S.A.I.C.
  { code: "TXAR", sector: "Materials" }, // Ternium Argentina S.A.
  { code: "LOMA", sector: "Materials" }, // Loma Negra Compañía Industrial Argentina Sociedad Anónima
  // Telecom
  { code: "TECO2", sector: "Telecom" }, // Telecom Argentina S.A.
  // Consumer
  { code: "CRES", sector: "Consumer" }, // Cresud Sociedad Anónima, Comercial, Inmobiliaria, Financiera y Agropecuaria
  { code: "COME", sector: "Consumer" }, // Sociedad Comercial del Plata S.A.
  // Industrial
  { code: "CVH", sector: "Industrial" }, // Cablevisión Holding S.A.
  // Property
  { code: "IRSA", sector: "Property" }, // IRSA Inversiones y Representaciones Sociedad Anónima
];

export function symbolFor(entry: UniverseEntry): string {
  return entry.kind === "index" ? INDEX_SYMBOL : `${entry.code}${EXCHANGE_SUFFIX}`;
}

// Japanese sector labels (same table the UI uses); consumed by sectorLabel() in market.ts
export const SECTOR_JA: Record<string, string> = { Banking: "銀行", Financials: "金融・取引所", Energy: "石油・ガス・電力", Materials: "鉄鋼・セメント・素材", Telecom: "通信", Staples: "食品", Consumer: "消費・小売", Industrial: "農業・インフラ・工業", Property: "不動産", Index: "指数" };
