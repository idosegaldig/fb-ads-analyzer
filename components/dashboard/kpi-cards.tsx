'use client';
import type { ParsedData } from '@/lib/types';
import { formatSpend, formatNum, formatCPR } from '@/lib/parse-csv';
import { TrendingDown, Users, Target, Wallet, FileBarChart } from 'lucide-react';

interface Props { data: ParsedData; }

export default function KpiCards({ data }: Props) {
  const { campaigns, ads, currency } = data;
  const curr = currency === 'NIS' ? 'NIS' : 'USD';

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalResults = campaigns.reduce((s, c) => s + c.results, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
  const avgCPR = totalResults > 0 ? totalSpend / totalResults : 0;
  const bestAd = ads.filter(a => a.cpr > 0).sort((a, b) => a.cpr - b.cpr)[0];

  const cards = [
    {
      label: 'Total Spend',
      value: formatSpend(totalSpend, curr),
      sub: `${campaigns.length} campaigns`,
      icon: Wallet,
      color: '#1B2E4B',
    },
    {
      label: 'Total Results',
      value: formatNum(totalResults),
      sub: campaigns.find(c => c.result_type)?.result_type || 'Results',
      icon: Target,
      color: '#2563EB',
    },
    {
      label: 'Avg. Cost / Result',
      value: formatCPR(avgCPR, curr),
      sub: 'across all campaigns',
      icon: TrendingDown,
      color: '#059669',
    },
    {
      label: 'Total Reach',
      value: formatNum(totalReach),
      sub: `${ads.length} ads`,
      icon: Users,
      color: '#0891B2',
    },
    {
      label: 'Best Ad CPR',
      value: bestAd ? formatCPR(bestAd.cpr, curr) : '—',
      sub: bestAd ? bestAd.display_name.slice(0, 28) : 'No results recorded',
      icon: FileBarChart,
      color: '#D97706',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`kpi-card fade-up fade-up-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                {c.label}
              </p>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: c.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color: c.color }} />
              </div>
            </div>
            <p className="font-mono-data" style={{ fontSize: 22, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.1 }}>{c.value}</p>
            <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
