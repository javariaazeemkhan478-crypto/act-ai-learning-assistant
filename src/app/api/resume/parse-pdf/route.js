import { NextResponse } from 'next/server';
import { getUserIdFromAuthHeader } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(req) {
  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'PDF file is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Please upload a PDF smaller than 4 MB.' }, { status: 413 });
    }

    const fileName = file.name?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileName.endsWith('.txt')) {
      return NextResponse.json({ text: buffer.toString('utf-8') });
    }

    if (!fileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or TXT.' },
        { status: 400 }
      );
    }

    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const parsed = await pdfParse(buffer);

    if (!parsed.text?.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Ensure the PDF has selectable text (not scanned images).' },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: parsed.text.trim(), pages: parsed.numpages });
  } catch (err) {
    console.error('PDF Parse Error:', err);
    return NextResponse.json({ error: 'Could not read this PDF. Try a text-based PDF, or paste the resume text instead.' }, { status: 422 });
  }
}
