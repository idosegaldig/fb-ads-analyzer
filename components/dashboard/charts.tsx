'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend,
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

      {/* Campaign: Results vs Spend scatter */}
      <div className="chart-wrap fade-up fade-up-3" style={{ gridColumn: 'span 2' }}>
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
