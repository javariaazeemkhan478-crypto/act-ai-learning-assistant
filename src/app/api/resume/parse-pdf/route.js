import { NextResponse } from 'next/server';
import { getUserIdFromAuthHeader } from '@/lib/auth';

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

    const pdfParse = (await import('pdf-parse')).default;
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
    return NextResponse.json({ error: 'Failed to parse PDF file' }, { status: 500 });
  }
}
