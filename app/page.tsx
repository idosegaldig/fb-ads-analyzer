'use client';
import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, FileText, Download, BarChart2, AlertCircle, X, Loader2 } from 'lucide-react';
import { parseCSV } from '@/lib/parse-csv';
import type { ParsedData } from '@/lib/types';
import KpiCards from '@/components/dashboard/kpi-cards';
import CampaignsTable from '@/components/dashboard/campaigns-table';
import AdsetsTable from '@/components/dashboard/adsets-table';
import AdsTable from '@/components/dashboard/ads-table';
import Charts from '@/components/dashboard/charts';

type Tab = 'overview' | 'campaigns' | 'adsets' | 'ads';

export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file from Facebook Ads Manager.'); return; }
    setCsvFile(file); setFileName(file.name); setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target?.result as string);
        setData(parsed); setActiveTab('overview');
      } catch (err: any) { setError(err.message || 'Could not parse CSV.'); setData(null); }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
  }, [processFile]);

  const downloadPDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    setError('');
    try {
      const { generatePDF } = await import('@/lib/generate-pdf-client');
      await generatePDF(data, fileName);
    } catch (err: any) {
      setError('PDF generation failed — please try again.');
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const reset = () => { setData(null); setFileName(''); setError(''); setCsvFile(null); if (fileRef.current) fileRef.current.value = ''; };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Charts' },
    { id: 'campaigns', label: 'Campaigns', count: data?.campaigns.length },
    { id: 'adsets', label: 'Ad Sets', count: data?.adsets.length },
    { id: 'ads', label: 'Ads', count: data?.ads.length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 64, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Center: Logo + Title on one line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Image src="/logo.png" alt="Ido Segal Studio" width={38} height={38} style={{ objectFit: 'contain' }} />
            <p style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontSize: 20, fontWeight: 500, color: 'var(--navy)', letterSpacing: '0.04em', whiteSpace: 'nowrap', lineHeight: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', fontFamily: "'Bodoni Moda', Georgia, serif" }}>IDO SEGAL STUDIO</span>
              <span style={{ margin: '0 10px', color: 'var(--border)', fontWeight: 300 }}>|</span>
              Meta Ads Analyzer
            </p>
          </div>
          {/* Right: Actions — absolute so they don't shift the center */}
          <div style={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            {data && (
              <>
                <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink-muted)', fontSize: 13, cursor: 'pointer' }}>
                  <X size={14} /> New File
                </button>
                <button onClick={downloadPDF} disabled={pdfLoading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--navy)', color: 'white', fontSize: 13, fontWeight: 500, cursor: pdfLoading ? 'wait' : 'pointer', opacity: pdfLoading ? 0.7 : 1 }}>
                  {pdfLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  {pdfLoading ? 'Generating PDF…' : 'Download PDF'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        {!data && (
          <div style={{ padding: '72px 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '5px 14px', borderRadius: 20, background: 'var(--gold-muted)', border: '1px solid rgba(245,197,66,0.3)' }}>
                <BarChart2 size={12} style={{ color: 'var(--gold-deep)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campaign Analytics</span>
              </div>
              <h1 className="font-display" style={{ fontSize: 56, fontWeight: 300, color: 'var(--navy)', lineHeight: 1.05, marginBottom: 16 }}>
                Facebook Ads<br /><em style={{ fontStyle: 'italic' }}>Performance</em> Dashboard
              </h1>
              <p style={{ fontSize: 16, color: 'var(--ink-muted)', maxWidth: 440, lineHeight: 1.65 }}>
                Upload your Ads Manager CSV export. Instantly visualize performance and generate a polished client-ready PDF report.
              </p>
            </div>

            <div
              className={`upload-zone${isDragging ? ' drag-over' : ''}`}
              style={{ width: '100%', maxWidth: 500, borderRadius: 16, padding: '52px 40px', textAlign: 'center' }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} style={{ display: 'none' }} />
              <div style={{ width: 56, height: 56, borderRadius: 14, background: isDragging ? 'var(--gold)' : 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', transition: 'all 250ms' }}>
                <Upload size={22} style={{ color: isDragging ? 'white' : 'var(--ink-muted)', transition: 'color 250ms' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>{isDragging ? 'Release to upload' : 'Drop your CSV here'}</p>
              <p style={{ fontSize: 13, color: 'var(--ink-faint)' }}>or <span style={{ color: 'var(--blue)', fontWeight: 500 }}>browse files</span> · Facebook Ads Manager export</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                {['Campaigns', 'Ad Sets', 'Ads', 'Charts', 'PDF Export'].map(f => (
                  <span key={f} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>{f}</span>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '11px 16px', borderRadius: 10, background: '#FFF1F1', border: '1px solid #FFC9C9', display: 'flex', alignItems: 'center', gap: 9, color: '#B91C1C', fontSize: 13, maxWidth: 500 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 48, marginTop: 56 }}>
              {[['01', 'Upload CSV', 'Export from Ads Manager and drag it in'],['02', 'Analyze', 'See campaigns, ad sets, and ad performance instantly'],['03', 'Download PDF', 'Generate a polished client-ready report in seconds']].map(([n, t, d]) => (
                <div key={n} style={{ textAlign: 'center', maxWidth: 155 }}>
                  <div className="font-display" style={{ fontSize: 36, fontWeight: 300, color: 'var(--gold)', marginBottom: 8 }}>{n}</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{t}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.55 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data && (
          <div style={{ padding: '24px 0 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: '5px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FileText size={13} style={{ color: 'var(--blue)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}>{fileName}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{data.campaigns.length} campaigns · {data.adsets.length} ad sets · {data.ads.length} ads · {data.currency}</span>
              </div>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C', fontSize: 12 }}><AlertCircle size={13} />{error}</div>}
            </div>

            <KpiCards data={data} />

            <div className="tab-list" style={{ marginBottom: 18 }}>
              {tabs.map(t => (
                <button key={t.id} className={`tab-trigger${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                  {t.count !== undefined && <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, background: activeTab === t.id ? 'var(--surface-2)' : 'transparent', fontSize: 11, fontWeight: 600, color: activeTab === t.id ? 'var(--navy)' : 'var(--ink-faint)' }}>{t.count}</span>}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {activeTab === 'overview' && <div style={{ padding: 20 }}><Charts data={data} /></div>}
              {activeTab === 'campaigns' && <CampaignsTable campaigns={data.campaigns} currency={data.currency} />}
              {activeTab === 'adsets' && <AdsetsTable adsets={data.adsets} currency={data.currency} />}
              {activeTab === 'ads' && <AdsTable ads={data.ads} currency={data.currency} />}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '18px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          <span className="font-display" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Ido Segal Studio</span> · FB Ads Analyzer
        </p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
