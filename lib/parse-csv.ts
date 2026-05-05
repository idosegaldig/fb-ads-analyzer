import type { AdRow, ParsedData, CampaignSummary, AdSetSummary, AdSummary } from './types';

const COLUMN_MAP: Record<string, keyof AdRow> = {
  'ad name': 'ad_name',
  'ad set name': 'adset_name',
  'campaign name': 'campaign_name',
  'reach': 'reach',
  'impressions': 'impressions',
  'results': 'results',
  'result type': 'result_type',
  'result indicator': 'result_type',
  'cost per result': 'cpr',
  'cost per results': 'cpr',
  'amount spent (usd)': 'spend',
  'amount spent (ils)': 'spend',
  'amount spent': 'spend',
  'spend': 'spend',
  'frequency': 'frequency',
  'landing page views': 'landing_page_views',
  'platform': 'platform',
};

function cleanKey(k: string): string {
  return k.replace(/^﻿/, '').replace(/^["'\s]+|["'\s]+$/g, '').toLowerCase().trim();
}

function toNum(v: string | undefined): number {
  if (!v || v === '-' || v === '') return 0;
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function firstNonNull<T>(arr: T[], fn: (v: T) => string | undefined): string {
  for (const v of arr) {
    const r = fn(v);
    if (r && r !== '-' && r !== '') return r;
  }
  return '';
}

export function parseCSV(csvText: string): ParsedData {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV has no data rows');

  // Detect currency
  const headerLine = lines[0];
  const currency: 'NIS' | 'USD' = headerLine.toUpperCase().includes('ILS') ? 'NIS' : 'USD';

  // Parse header
  const headers = headerLine.split(',').map(h =>
    h.replace(/^﻿/, '').replace(/^"|"$/g, '').trim()
  );

  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    const mapped = COLUMN_MAP[cleanKey(h)];
    if (mapped && !(mapped in colIndex)) colIndex[mapped] = i;
  });

  // Parse rows
  const rows: AdRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle quoted fields with commas
    const cells: string[] = [];
    let inQ = false, cur = '';
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cells.push(cur.trim());

    const get = (field: string) => cells[colIndex[field] ?? -1] ?? '';

    const reach = toNum(get('reach'));
    const spend = toNum(get('spend'));
    if (reach === 0 && spend === 0) continue;

    const adName = get('ad_name') || get('campaign_name');
    rows.push({
      campaign_name: get('campaign_name'),
      adset_name: get('adset_name'),
      ad_name: adName,
      display_name: adName,
      platform: get('platform'),
      reach,
      results: toNum(get('results')),
      result_type: get('result_type'),
      cpr: toNum(get('cpr')),
      spend,
      landing_page_views: toNum(get('landing_page_views')),
      impressions: toNum(get('impressions')),
      frequency: toNum(get('frequency')),
    });
  }

  if (rows.length === 0) throw new Error('No valid data rows found');

  // Aggregate campaigns
  const campMap = new Map<string, AdRow[]>();
  rows.forEach(r => {
    const k = r.campaign_name;
    if (!campMap.has(k)) campMap.set(k, []);
    campMap.get(k)!.push(r);
  });

  const campaigns: CampaignSummary[] = Array.from(campMap.entries()).map(([name, rs]) => {
    const spend = rs.reduce((s, r) => s + r.spend, 0);
    const results = rs.reduce((s, r) => s + r.results, 0);
    const reach = rs.reduce((s, r) => s + r.reach, 0);
    const lpv = rs.reduce((s, r) => s + r.landing_page_views, 0);
    return {
      campaign_name: name,
      reach, results, spend,
      landing_page_views: lpv,
      result_type: firstNonNull(rs, r => r.result_type),
      cpr: results > 0 ? spend / results : 0,
    };
  }).sort((a, b) => b.spend - a.spend);

  // Aggregate ad sets
  const adsetMap = new Map<string, AdRow[]>();
  rows.forEach(r => {
    const k = `${r.campaign_name}|||${r.adset_name}`;
    if (!adsetMap.has(k)) adsetMap.set(k, []);
    adsetMap.get(k)!.push(r);
  });

  const adsets: AdSetSummary[] = Array.from(adsetMap.entries()).map(([key, rs]) => {
    const [campaign_name, adset_name] = key.split('|||');
    const spend = rs.reduce((s, r) => s + r.spend, 0);
    const results = rs.reduce((s, r) => s + r.results, 0);
    const reach = rs.reduce((s, r) => s + r.reach, 0);
    const lpv = rs.reduce((s, r) => s + r.landing_page_views, 0);
    return {
      campaign_name, adset_name, reach, results, spend,
      landing_page_views: lpv,
      cpr: results > 0 ? spend / results : 0,
    };
  });

  // Aggregate ads
  const adMap = new Map<string, AdRow[]>();
  rows.forEach(r => {
    const k = `${r.campaign_name}|||${r.adset_name}|||${r.ad_name}`;
    if (!adMap.has(k)) adMap.set(k, []);
    adMap.get(k)!.push(r);
  });

  const ads: AdSummary[] = Array.from(adMap.entries()).map(([key, rs]) => {
    const [campaign_name, adset_name, ad_name] = key.split('|||');
    const spend = rs.reduce((s, r) => s + r.spend, 0);
    const results = rs.reduce((s, r) => s + r.results, 0);
    const reach = rs.reduce((s, r) => s + r.reach, 0);
    const lpv = rs.reduce((s, r) => s + r.landing_page_views, 0);
    return {
      campaign_name, adset_name, ad_name,
      display_name: rs[0].display_name,
      reach, results, spend,
      landing_page_views: lpv,
      cpr: results > 0 ? spend / results : 0,
    };
  });

  // Date range
  const dateStart = firstNonNull(rows, () => undefined);
  const dateRange = `${rows.length} ad rows parsed`;

  return { campaigns, adsets, ads, currency, dateRange, rawRows: rows };
}

export function formatNum(n: number): string {
  if (n === 0) return '—';
  return n.toLocaleString('en', { maximumFractionDigits: 0 });
}

export function formatCPR(n: number, currency: string): string {
  if (n === 0) return '—';
  return `${currency === 'NIS' ? '₪' : '$'}${n.toFixed(2)}`;
}

export function formatSpend(n: number, currency: string): string {
  const sym = currency === 'NIS' ? '₪' : '$';
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
}
