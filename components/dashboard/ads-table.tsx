'use client';
import type { AdSummary } from '@/lib/types';
import { formatNum, formatCPR, formatSpend } from '@/lib/parse-csv';

interface Props { ads: AdSummary[]; currency: string; }

export default function AdsTable({ ads, currency }: Props) {
  const curr = currency === 'NIS' ? 'NIS' : 'USD';

  // Group by campaign then adset
  const grouped: Record<string, Record<string, AdSummary[]>> = {};
  ads.forEach(a => {
    if (!grouped[a.campaign_name]) grouped[a.campaign_name] = {};
    if (!grouped[a.campaign_name][a.adset_name]) grouped[a.campaign_name][a.adset_name] = [];
    grouped[a.campaign_name][a.adset_name].push(a);
  });

  const bestCPR = Math.min(...ads.filter(a => a.cpr > 0).map(a => a.cpr));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Ad Name</th>
            <th style={{ textAlign: 'right' }}>Reach</th>
            <th style={{ textAlign: 'right' }}>Results</th>
            <th style={{ textAlign: 'right' }}>LPV</th>
            <th style={{ textAlign: 'right' }}>Cost/Result</th>
            <th style={{ textAlign: 'right' }}>Spend</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([camp, adsets]) => (
            <>
              <tr key={`h-${camp}`} className="section-header">
                <td colSpan={6}>{camp.toUpperCase()}</td>
              </tr>
              {Object.entries(adsets).map(([adset, adList]) => (
                <>
                  <tr key={`s-${camp}-${adset}`} className="subsection-header">
                    <td colSpan={6}>{adset}</td>
                  </tr>
                  {adList.map((a, i) => (
                    <tr key={`${a.campaign_name}-${a.adset_name}-${a.ad_name}-${i}`}
                        style={{ background: a.cpr === bestCPR && a.cpr > 0 ? '#F0FDF4' : undefined }}>
                      <td style={{ fontWeight: 500, color: 'var(--ink)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.cpr === bestCPR && a.cpr > 0 && (
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', marginRight: 7, verticalAlign: 'middle' }} />
                        )}
                        {a.display_name}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(a.reach)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                        {a.results > 0 ? <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '2px 7px', fontWeight: 600, fontSize: 12 }}>{formatNum(a.results)}</span> : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{formatNum(a.landing_page_views)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: a.cpr > 0 ? (a.cpr === bestCPR ? 'var(--emerald)' : 'var(--ink-soft)') : 'var(--ink-faint)', fontWeight: a.cpr === bestCPR ? 600 : 400 }}>
                        {formatCPR(a.cpr, curr)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{formatSpend(a.spend, curr)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
