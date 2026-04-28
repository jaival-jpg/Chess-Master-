import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'node_modules', 'stockfish.js', 'stockfish.js');
    const text = fs.readFileSync(file, 'utf-8');
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new NextResponse('Error loading stockfish', { status: 500 });
  }
}
