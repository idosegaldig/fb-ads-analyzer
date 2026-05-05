import type { ParsedData } from './types';

const NAVY       = [27,  46,  75]  as [number, number, number];
const WHITE      = [255, 255, 255] as [number, number, number];
const MUTED      = [248, 250, 252] as [number, number, number];
const SECTION_BG = [238, 242, 248] as [number, number, number];
const GOLD       = [245, 197, 66]  as [number, number, number];

const HEBREW_RE = /[֐-׿יִ-ﯿﭐ-﷿]/;

/** Reorder Hebrew/mixed text to visual (LTR display) order via bidi algorithm */
async function bidiText(text: string): Promise<string> {
  if (!text || !HEBREW_RE.test(text)) return text;
  try {
    const bidi = await import('bidi-js');
    const levels = bidi.getEmbeddingLevels(text, 'rtl');
    return bidi.getReorderedString(text, levels);
  } catch {
    // Fallback: naive reversal for pure-Hebrew strings
    return text.split('').reverse().join('');
  }
}

/** Run bidi on all string values in a 2-D table body */
async function processBidiRows(rows: any[][]): Promise<any[][]> {
  return Promise.all(rows.map(row =>
    Promise.all(row.map(async cell => {
      if (typeof cell === 'string') return bidiText(cell);
      if (cell && typeof cell === 'object' && typeof cell.content === 'string') {
        return { ...cell, content: await bidiText(cell.content) };
      }
      return cell;
    }))
  ));
}

function fmt(n: number, currency: string): string {
  const sym = currency === 'NIS' ? '₪' : '$';
  return n > 0 ? `${sym}${n.toLocaleString('en', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : '—';
}
function fmtN(n: number): string { return n > 0 ? n.toLocaleString('en', { maximumFractionDigits: 0 }) : '—'; }
function short(s: string, max = 38): string { return s.length <= max ? s : s.slice(0, max - 1) + '…'; }

/** Load font as base64 string */
async function loadFontBase64(url: string): Promise<string> {
  const res  = await fetch(url);
  const buf  = await res.arrayBuffer();
  const u8   = new Uint8Array(buf);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function generatePDF(data: ParsedData, fileName: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  // Load and register Hebrew font
  const fontBase64 = await loadFontBase64('/fonts/OpenSansHebrew-Regular.ttf');
  const FONT_NAME  = 'OpenSansHebrew';

  const curr = data.currency;
  const sym  = curr === 'NIS' ? '₪' : '$';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Register Hebrew font with jsPDF
  doc.addFileToVFS(`${FONT_NAME}.ttf`, fontBase64);
  doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');

  const PW  = doc.internal.pageSize.getWidth();   // 841.89
  const PH  = doc.internal.pageSize.getHeight();  // 595.27
  const M   = 40;
  const now = new Date().toLocaleDateString('en-GB');

  // Shared autotable styles using Hebrew font
  const tableStyles = {
    font: FONT_NAME,
    fontStyle: 'normal' as const,
  };
  const headStyles = {
    fillColor: NAVY, textColor: WHITE,
    font: FONT_NAME, fontStyle: 'normal' as const,
    fontSize: 10, halign: 'center' as const,
  };

  const addFooter = (pageNum: number, total: number) => {
    doc.setFont(FONT_NAME, 'normal');
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
    doc.setFont(FONT_NAME, 'normal');
    doc.text(title, M, M + 22);
    // Studio tag
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.setFont(FONT_NAME, 'normal');
    doc.text('IDO SEGAL STUDIO  ·  Meta Ads Analyzer', PW - M, M + 22, { align: 'right' });
    return M + 36;
  };

  const totalPages = 3;

  // ── PAGE 1: Campaigns ────────────────────────────────────────────────────
  let y = addPageHeader('Campaigns');

  const campRawBody = data.campaigns.map(c => [
    short(c.campaign_name),
    fmtN(c.reach),
    fmtN(c.results),
    fmtN(c.landing_page_views),
    c.result_type || '—',
    fmt(c.cpr, curr),
    fmt(c.spend, curr),
  ]);
  const campBody = await processBidiRows(campRawBody);

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Campaign', 'Reach', 'Results', 'LPV', 'Result Type', 'Cost/Result', 'Spend']],
    body: campBody,
    headStyles,
    bodyStyles:  { ...tableStyles, fontSize: 11, textColor: [50, 50, 50] as [number,number,number] },
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
    styles: { ...tableStyles, cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
  });

  addFooter(1, totalPages);

  // ── PAGE 2: Ad Sets ──────────────────────────────────────────────────────
  doc.addPage();
  y = addPageHeader('Ad Sets');

  const adsetBodyRaw: any[] = [];
  const adsetStyles: Record<number, any> = {};

  let rowIdx = 0;
  const campGroups: Record<string, typeof data.adsets> = {};
  data.adsets.forEach(a => {
    if (!campGroups[a.campaign_name]) campGroups[a.campaign_name] = [];
    campGroups[a.campaign_name].push(a);
  });

  for (const [camp, sets] of Object.entries(campGroups)) {
    adsetBodyRaw.push([{ content: await bidiText(camp.toUpperCase()), colSpan: 6 }]);
    adsetStyles[rowIdx] = { fillColor: NAVY, textColor: WHITE, font: FONT_NAME, fontStyle: 'normal', fontSize: 10 };
    rowIdx++;
    for (const a of sets) {
      adsetBodyRaw.push([
        await bidiText(short(a.adset_name)),
        fmtN(a.reach),
        fmtN(a.results),
        fmtN(a.landing_page_views),
        fmt(a.cpr, curr),
        fmt(a.spend, curr),
      ]);
      rowIdx++;
    }
  }
  const adsetBody = adsetBodyRaw; // already bidi-processed above

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Ad Set', 'Reach', 'Results', 'LPV', 'Cost/Result', 'Spend']],
    body: adsetBody,
    headStyles,
    bodyStyles:  { ...tableStyles, fontSize: 11, textColor: [50, 50, 50] as [number,number,number] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 250 },
      1: { halign: 'right', cellWidth: 80 },
      2: { halign: 'right', cellWidth: 70 },
      3: { halign: 'right', cellWidth: 65 },
      4: { halign: 'right', cellWidth: 100 },
      5: { halign: 'right', cellWidth: 100 },
    },
    alternateRowStyles: { fillColor: MUTED },
    styles: { ...tableStyles, cellPadding: { top: 6, bottom: 6, left: 8, right: 8 } },
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

  for (const [camp, adsets] of Object.entries(campAds)) {
    adsBody.push([{ content: await bidiText(camp.toUpperCase()), colSpan: 6 }]);
    adsRowStyles[aRowIdx] = { fillColor: NAVY, textColor: WHITE, font: FONT_NAME, fontStyle: 'normal', fontSize: 10 };
    aRowIdx++;
    for (const [adset, adList] of Object.entries(adsets)) {
      adsBody.push([{ content: await bidiText(adset), colSpan: 6 }]);
      adsRowStyles[aRowIdx] = { fillColor: SECTION_BG, textColor: NAVY, font: FONT_NAME, fontStyle: 'normal', fontSize: 10 };
      aRowIdx++;
      for (const a of adList) {
        adsBody.push([
          await bidiText(short(a.display_name)),
          fmtN(a.reach),
          fmtN(a.results),
          fmtN(a.landing_page_views),
          fmt(a.cpr, curr),
          fmt(a.spend, curr),
        ]);
        if (a.cpr === bestCPR && a.cpr > 0) {
          adsRowStyles[aRowIdx] = { fillColor: [240, 253, 244] as [number,number,number], font: FONT_NAME, fontStyle: 'normal' };
        }
        aRowIdx++;
      }
    }
  }

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Ad Name', 'Reach', 'Results', 'LPV', 'Cost/Result', 'Spend']],
    body: adsBody,
    headStyles,
    bodyStyles:  { ...tableStyles, fontSize: 11, textColor: [50, 50, 50] as [number,number,number] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 270 },
      1: { halign: 'right', cellWidth: 75 },
      2: { halign: 'right', cellWidth: 65 },
      3: { halign: 'right', cellWidth: 60 },
      4: { halign: 'right', cellWidth: 100 },
      5: { halign: 'right', cellWidth: 100 },
    },
    alternateRowStyles: { fillColor: MUTED },
    styles: { ...tableStyles, cellPadding: { top: 5, bottom: 5, left: 8, right: 8 } },
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
