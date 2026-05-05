import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('csv') as File;
  const title = (formData.get('title') as string) || 'Campaign Performance Report';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const csvText = await file.text();
  const tmpCsv = join(tmpdir(), `fb-ads-${Date.now()}.csv`);
  const tmpOut = tmpdir();

  try {
    await writeFile(tmpCsv, csvText);

    const generatorPath = `${process.env.HOME}/.claude/skills/fb-ads-report/generate.py`;
    const { stdout, stderr } = await execAsync(
      `python3 "${generatorPath}" "${tmpCsv}" --title "${title}" --preparer "IDO SEGAL STUDIO" --output-dir "${tmpOut}"`,
      { timeout: 60000 }
    );

    const match = stdout.match(/REPORT_PATH=(.+)/);
    if (!match) {
      console.error('PDF generator stderr:', stderr);
      return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
    }

    const pdfPath = match[1].trim();
    const pdfBuffer = await readFile(pdfPath);
    await unlink(tmpCsv).catch(() => {});
    await unlink(pdfPath).catch(() => {});

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="campaign-report.pdf"`,
      },
    });
  } catch (err: any) {
    await unlink(tmpCsv).catch(() => {});
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
