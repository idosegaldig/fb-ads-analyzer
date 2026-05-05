'use client';
import type { CampaignSummary } from '@/lib/types';
import { formatNum, formatCPR, formatSpend } from '@/lib/parse-csv';

interface Props { campaigns: CampaignSummary[]; currency: string; }

export default function CampaignsTable({ campaigns, currency }: Props) {
  const curr = currency === 'NIS' ? 'NIS' : 'USD';
  const maxSpend = Math.max(...campaigns.map(c => c.spend));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Campaign</th>
            <th style={{ textAlign: 'right' }}>Reach</th>
            <th style={{ textAlign: 'right' }}>Results</th>
            <th style={{ textAlign: 'right' }}>LPV</th>
            <th style={{ textAlign: 'left', minWidth: 90 }}>Result Type</th>
            <th style={{ textAlign: 'right' }}>Cost/Result</th>
            <th style={{ textAlign: 'right' }}>Spend</th>
            <th style={{ textAlign: 'left', minWidth: 120 }}>Spend Bar</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.campaign_name}>
              <td style={{ fontWeight: 500, color: 'var(--navy)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.campaign_name}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(c.reach)}</td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                {c.results > 0 ? <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 7px', fontWeight: 600, fontSize: 12 }}>{formatNum(c.results)}</span> : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(c.landing_page_views)}</td>
              <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{c.result_type || '—'}</td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: c.cpr > 0 ? 'var(--emerald)' : 'var(--ink-faint)' }}>{formatCPR(c.cpr, curr)}</td>
              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{formatSpend(c.spend, curr)}</td>
              <td style={{ minWidth: 120 }}>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.spend / maxSpend) * 100}%`, background: 'var(--blue)', borderRadius: 3, transition: 'width 600ms ease' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
