'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie,
} from 'recharts';
import type { ParsedData } from '@/lib/types';
import { CHART_COLORS } from '@/lib/types';
import { formatCPR, formatSpend, formatNum } from '@/lib/parse-csv';

interface Props { data: ParsedData; }

const short = (s: string, max = 22) => s.length <= max ? s : s.slice(0, max - 1) + '…';

export default function Charts({ data }: Props) {
  const { ads, campaigns, currency } = data;
  const curr = currency === 'NIS' ? 'NIS' : 'USD';
  const sym = curr === 'NIS' ? '₪' : '$';

  const adsWithResults = ads.filter(a => a.cpr > 0).sort((a, b) => a.cpr - b.cpr).slice(0, 15);
  const adsWithResultCount = ads.filter(a => a.results > 0).sort((a, b) => b.results - a.results).slice(0, 15);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 13 }}>
        <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{d.display_name || d.campaign_name}</p>
        {d.cpr > 0 && <p style={{ color: 'var(--emerald)' }}>CPR: {sym}{d.cpr.toFixed(2)}</p>}
        {d.results > 0 && <p style={{ color: 'var(--blue)' }}>Results: {formatNum(d.results)}</p>}
        {d.spend > 0 && <p style={{ color: 'var(--ink-soft)' }}>Spend: {sym}{d.spend.toFixed(0)}</p>}
      </div>
    );
  };

  // Per-campaign: ads within each campaign with full metrics
  const campaignPies = campaigns.map((camp, ci) => {
    const campAds = ads.filter(a => a.campaign_name === camp.campaign_name && a.spend > 0)
                       .sort((a, b) => b.spend - a.spend);
    const campTotal   = campAds.reduce((s, a) => s + a.spend, 0);
    const campResults = campAds.reduce((s, a) => s + a.results, 0);
    return {
      campaign_name: camp.campaign_name,
      campTotal,
      campResults,
      result_type: camp.result_type,
      color: CHART_COLORS[ci % CHART_COLORS.length],
      slices: campAds.map((a, ai) => ({
        name: a.display_name,
        value: a.spend,
        pct: campTotal > 0 ? ((a.spend / campTotal) * 100).toFixed(1) : '0',
        color: CHART_COLORS[ai % CHART_COLORS.length],
        results: a.results,
        cpr: a.cpr,
        reach: a.reach,
      })),
    };
  }).filter(cp => cp.slices.length > 0);

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12, maxWidth: 220 }}>
        <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 3 }}>{d.name}</p>
        <p style={{ color: 'var(--blue)' }}>Spend: {sym}{(d.value as number).toLocaleString('en', { maximumFractionDigits: 0 })}</p>
        <p style={{ color: 'var(--ink-muted)' }}>Share: {d.pct}% of campaign</p>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

      {/* CPR Efficiency */}
      <div className="chart-wrap fade-up fade-up-1">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 16, letterSpacing: '0.02em' }}>
          Cost per Result — Efficiency Ranking
        </h3>
        {adsWithResults.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No cost-per-result data</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, adsWithResults.length * 36)}>
            <BarChart data={adsWithResults} layout="vertical" margin={{ left: 0, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} tickFormatter={v => `${sym}${v.toFixed(2)}`} />
              <YAxis type="category" dataKey="display_name" width={140} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickFormatter={s => short(s, 20)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cpr" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: 'var(--ink-muted)', formatter: (v: unknown) => `${sym}${(v as number).toFixed(2)}` }}>
                {adsWithResults.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? '#059669' : CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Results Count */}
      <div className="chart-wrap fade-up fade-up-2">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 16, letterSpacing: '0.02em' }}>
          Results by Ad
        </h3>
        {adsWithResultCount.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No results data</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, adsWithResultCount.length * 36)}>
            <BarChart data={adsWithResultCount} layout="vertical" margin={{ left: 0, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} />
              <YAxis type="category" dataKey="display_name" width={140} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickFormatter={s => short(s, 20)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="results" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: 'var(--ink-muted)' }}>
                {adsWithResultCount.map((entry, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Budget Distribution — one full-width row per campaign */}
      <div className="chart-wrap fade-up fade-up-3" style={{ gridColumn: 'span 2' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 20, letterSpacing: '0.02em' }}>
          Budget Distribution by Ad — per Campaign
        </h3>
        {campaignPies.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>No spend data</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {campaignPies.map((cp, ci) => (
              <div key={cp.campaign_name} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

                {/* ── Campaign header strip ── */}
                <div style={{ background: 'var(--navy)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 32 }}>
                  {/* Donut — small, inline */}
                  <div style={{ flexShrink: 0 }}>
                    <PieChart width={72} height={72}>
                      <Pie data={cp.slices} cx={33} cy={33} innerRadius={22} outerRadius={34} paddingAngle={2} dataKey="value" stroke="none">
                        {cp.slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </div>
                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>Campaign</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.campaign_name}</p>
                  </div>
                  {/* Budget */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>Total Budget</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: 'JetBrains Mono, monospace' }}>{sym}{cp.campTotal.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
                  </div>
                  {/* Results */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>{cp.result_type || 'Results'}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: cp.campResults > 0 ? '#6EE7B7' : 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {cp.campResults > 0 ? cp.campResults.toLocaleString('en') : '—'}
                    </p>
                  </div>
                </div>

                {/* ── Ads table ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Ad Name', '% Budget', 'Spend', 'Results', 'Cost / Result', 'Reach'].map((h, hi) => (
                        <th key={h} style={{ padding: '8px 14px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)', textAlign: hi === 0 ? 'left' : 'right', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cp.slices.map((s, si) => (
                      <tr key={s.name} style={{ background: si % 2 === 0 ? 'white' : 'var(--surface-2)' }}>
                        {/* Ad name + color dot */}
                        <td style={{ padding: '9px 14px', maxWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ flexShrink: 0, width: 9, height: 9, borderRadius: 3, background: s.color }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          </div>
                        </td>
                        {/* % Budget bar + value */}
                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <div style={{ width: 50, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', fontFamily: 'JetBrains Mono, monospace', minWidth: 38, textAlign: 'right' }}>{s.pct}%</span>
                          </div>
                        </td>
                        {/* Spend */}
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                          {sym}{s.value.toLocaleString('en', { maximumFractionDigits: 0 })}
                        </td>
                        {/* Results */}
                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                          {s.results > 0
                            ? <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 5, padding: '2px 8px', fontWeight: 600, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{s.results}</span>
                            : <span style={{ color: 'var(--ink-faint)', fontSize: 13 }}>—</span>}
                        </td>
                        {/* Cost / Result */}
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: s.cpr > 0 ? 'var(--emerald)' : 'var(--ink-faint)' }}>
                          {s.cpr > 0 ? `${sym}${s.cpr.toFixed(2)}` : '—'}
                        </td>
                        {/* Reach */}
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--ink-soft)' }}>
                          {s.reach > 0 ? s.reach.toLocaleString('en') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign: Results vs Spend scatter */}
      <div className="chart-wrap fade-up fade-up-4">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 16, letterSpacing: '0.02em' }}>
          Campaigns — Results vs. Spend
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 40, bottom: 30, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" />
            <XAxis type="number" dataKey="results" name="Results" tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} label={{ value: 'Results', position: 'insideBottom', offset: -10, fontSize: 12, fill: 'var(--ink-muted)' }} />
            <YAxis type="number" dataKey="spend" name="Spend" tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} tickFormatter={v => `${sym}${(v/1000).toFixed(1)}K`} label={{ value: `Spend (${sym})`, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: 'var(--ink-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={campaigns} shape={(props: any) => {
              const { cx, cy, payload, index } = props;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={8} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} stroke="white" strokeWidth={2} />
                  <text x={cx + 12} y={cy + 4} fontSize={10} fill="var(--ink-muted)" textAnchor="start">{short(payload.campaign_name, 22)}</text>
                </g>
              );
            }}>
              {campaigns.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
