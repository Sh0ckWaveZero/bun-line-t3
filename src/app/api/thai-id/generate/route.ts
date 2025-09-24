import { NextRequest, NextResponse } from 'next/server';
import { generateFormattedThaiID, generateMultipleThaiIDs } from '@/lib/utils/thai-id-generator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '1');

  // Validate count
  if (count < 1 || count > 20) {
    return NextResponse.json(
      { error: 'Count must be between 1 and 20' },
      { status: 400 }
    );
  }

  try {
    if (count === 1) {
      const id = generateFormattedThaiID();
      return NextResponse.json({ id });
    } else {
      const ids = generateMultipleThaiIDs(count);
      return NextResponse.json({ ids });
    }
  } catch (error) {
    console.error('Error generating Thai ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate Thai ID' },
      { status: 500 }
    );
  }
}
