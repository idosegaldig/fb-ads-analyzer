import type { ParsedData } from './types';

const NAVY  = [27,  46,  75]  as [number, number, number];
const BLUE  = [37,  99,  235] as [number, number, number];
const SECTION_BG = [238, 242, 248] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const MUTED = [248, 250, 252] as [number, number, number];
const GOLD  = [245, 197, 66]  as [number, number, number];

function fmt(n: number, currency: string): string {
  const sym = currency === 'NIS' ? '₪' : '$';
  return n > 0 ? `${sym}${n.toLocaleString('en', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : '—';
}
function fmtN(n: number): string { return n > 0 ? n.toLocaleString('en', { maximumFractionDigits: 0 }) : '—'; }
function short(s: string, max = 38): string { return s.length <= max ? s : s.slice(0, max - 1) + '…'; }

export async function generatePDF(data: ParsedData, fileName: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const curr = data.currency;
  const sym  = curr === 'NIS' ? '₪' : '$';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();   // 841.89
  const PH  = doc.internal.pageSize.getHeight();  // 595.27
  const M   = 40;
  const now = new Date().toLocaleDateString('en-GB');

  const addFooter = (pageNum: number, total: number) => {
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(`Source: ${fileName}  ·  Generated ${now}  ·  IDO SEGAL STUDIO`, M, PH - 18);
    doc.text(`Page ${pageNum} of ${total}`, PW - M, PH - 18, { align: 'right' });
  };

  const addPageHeader = (title: string) => {
    // Gold accent bar
    doc.setFillColor(...GOLD);
    doc.rect(M, M, PW - 2 * M, 2, 'F');
    // Title
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(title, M, M + 22);
    // Studio tag
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.text('IDO SEGAL STUDIO  ·  Meta Ads Analyzer', PW - M, M + 22, { align: 'right' });
    return M + 36; // y after header
  };

  const totalPages = 3;

  // ── PAGE 1: Campaigns ────────────────────────────────────────────────────
  let y = addPageHeader('Campaigns');

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Campaign', 'Reach', 'Results', 'LPV', 'Result Type', 'Cost/Result', 'Spend']],
    body: data.campaigns.map(c => [
      short(c.campaign_name),
      fmtN(c.reach),
      fmtN(c.results),
      fmtN(c.landing_page_views),
      c.result_type || '—',
      fmt(c.cpr, curr),
      fmt(c.spend, curr),
    ]),
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 10, halign: 'center' },
    bodyStyles:  { fontSize: 11, textColor: [50, 50, 50] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 210 },
      1: { halign: 'right', cellWidth: 72 },
      2: { halign: 'right', cellWidth: 65 },
      3: { halign: 'right', cellWidth: 55 },
      4: { halign: 'left',  cellWidth: 110 },
      5: { halign: 'right', cellWidth: 85 },
      6: { halign: 'right', cellWidth: 85 },
    },
    alternateRowStyles: { fillColor: MUTED },
    styles: { cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
  });

  addFooter(1, totalPages);

  // ── PAGE 2: Ad Sets ──────────────────────────────────────────────────────
  doc.addPage();
  y = addPageHeader('Ad Sets');

  const adsetBody: any[] = [];
  const adsetStyles: Record<number, any> = {};

  let rowIdx = 0;
  const campGroups: Record<string, typeof data.adsets> = {};
  data.adsets.forEach(a => {
    if (!campGroups[a.campaign_name]) campGroups[a.campaign_name] = [];
    campGroups[a.campaign_name].push(a);
  });

  Object.entries(campGroups).forEach(([camp, sets]) => {
    adsetBody.push([{ content: camp.toUpperCase(), colSpan: 6 }]);
    adsetStyles[rowIdx] = { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 10 };
    rowIdx++;
    sets.forEach(a => {
      adsetBody.push([
        short(a.adset_name),
        fmtN(a.reach),
        fmtN(a.results),
        fmtN(a.landing_page_views),
        fmt(a.cpr, curr),
        fmt(a.spend, curr),
      ]);
      rowIdx++;
    });
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Ad Set', 'Reach', 'Results', 'LPV', 'Cost/Result', 'Spend']],
    body: adsetBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
    bodyStyles:  { fontSize: 11, textColor: [50, 50, 50] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 250 },
      1: { halign: 'right', cellWidth: 80 },
      2: { halign: 'right', cellWidth: 70 },
      3: { halign: 'right', cellWidth: 65 },
      4: { halign: 'right', cellWidth: 100 },
      5: { halign: 'right', cellWidth: 100 },
    },
    alternateRowStyles: { fillColor: MUTED },
    styles: { cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
    didParseCell: (hookData) => {
      const style = adsetStyles[hookData.row.index];
      if (style) Object.assign(hookData.cell.styles, style);
    },
  });

  addFooter(2, totalPages);

  // ── PAGE 3: Ads ──────────────────────────────────────────────────────────
  doc.addPage();
  y = addPageHeader('Ads');

  const adsBody: any[] = [];
  const adsRowStyles: Record<number, any> = {};
  const bestCPR = Math.min(...data.ads.filter(a => a.cpr > 0).map(a => a.cpr));

  let aRowIdx = 0;
  const campAds: Record<string, Record<string, typeof data.ads>> = {};
  data.ads.forEach(a => {
    if (!campAds[a.campaign_name]) campAds[a.campaign_name] = {};
    if (!campAds[a.campaign_name][a.adset_name]) campAds[a.campaign_name][a.adset_name] = [];
    campAds[a.campaign_name][a.adset_name].push(a);
  });

  Object.entries(campAds).forEach(([camp, adsets]) => {
    adsBody.push([{ content: camp.toUpperCase(), colSpan: 6 }]);
    adsRowStyles[aRowIdx] = { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 10 };
    aRowIdx++;
    Object.entries(adsets).forEach(([adset, adList]) => {
      adsBody.push([{ content: adset, colSpan: 6 }]);
      adsRowStyles[aRowIdx] = { fillColor: SECTION_BG, textColor: NAVY, fontStyle: 'bold', fontSize: 10 };
      aRowIdx++;
      adList.forEach(a => {
        adsBody.push([
          short(a.display_name),
          fmtN(a.reach),
          fmtN(a.results),
          fmtN(a.landing_page_views),
          fmt(a.cpr, curr),
          fmt(a.spend, curr),
        ]);
        if (a.cpr === bestCPR && a.cpr > 0) {
          adsRowStyles[aRowIdx] = { fillColor: [240, 253, 244], fontStyle: 'bold' };
        }
        aRowIdx++;
      });
    });
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Ad Name', 'Reach', 'Results', 'LPV', 'Cost/Result', 'Spend']],
    body: adsBody,
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 10 },
    bodyStyles:  { fontSize: 11, textColor: [50, 50, 50] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 270 },
      1: { halign: 'right', cellWidth: 75 },
      2: { halign: 'right', cellWidth: 65 },
      3: { halign: 'right', cellWidth: 60 },
      4: { halign: 'right', cellWidth: 100 },
      5: { halign: 'right', cellWidth: 100 },
    },
    alternateRowStyles: { fillColor: MUTED },
    styles: { cellPadding: { top: 5, bottom: 5, left: 8, right: 8 } },
    didParseCell: (hookData) => {
      const style = adsRowStyles[hookData.row.index];
      if (style) Object.assign(hookData.cell.styles, style);
    },
  });

  addFooter(3, totalPages);

  // Save
  const outName = fileName.replace('.csv', '-report.pdf');
  doc.save(outName);
}
