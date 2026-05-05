'use client';
import type { AdSetSummary } from '@/lib/types';
import { formatNum, formatCPR, formatSpend } from '@/lib/parse-csv';

interface Props { adsets: AdSetSummary[]; currency: string; }

export default function AdsetsTable({ adsets, currency }: Props) {
  const curr = currency === 'NIS' ? 'NIS' : 'USD';

  // Group by campaign
  const grouped = adsets.reduce<Record<string, AdSetSummary[]>>((acc, a) => {
    if (!acc[a.campaign_name]) acc[a.campaign_name] = [];
    acc[a.campaign_name].push(a);
    return acc;
  }, {});

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Ad Set</th>
            <th style={{ textAlign: 'right' }}>Reach</th>
            <th style={{ textAlign: 'right' }}>Results</th>
            <th style={{ textAlign: 'right' }}>LPV</th>
            <th style={{ textAlign: 'right' }}>Cost/Result</th>
            <th style={{ textAlign: 'right' }}>Spend</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([camp, sets]) => (
            <>
              <tr key={`h-${camp}`} className="section-header">
                <td colSpan={6}>{camp.toUpperCase()}</td>
              </tr>
              {sets.map((a) => (
                <tr key={`${a.campaign_name}-${a.adset_name}`}>
                  <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{a.adset_name}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(a.reach)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                    {a.results > 0 ? <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 7px', fontWeight: 600, fontSize: 12 }}>{formatNum(a.results)}</span> : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(a.landing_page_views)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: a.cpr > 0 ? 'var(--emerald)' : 'var(--ink-faint)' }}>{formatCPR(a.cpr, curr)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{formatSpend(a.spend, curr)}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
