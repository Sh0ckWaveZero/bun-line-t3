import { NextRequest, NextResponse } from 'next/server';
import { validateThaiID, formatThaiID } from '@/lib/utils/thai-id-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID is required and must be a string' },
        { status: 400 }
      );
    }

    const isValid = validateThaiID(id);
    let formattedId = id;

    try {
      const cleanId = id.replace(/[-\s]/g, '');
      if (cleanId.length === 13) {
        formattedId = formatThaiID(cleanId);
      }
    } catch {
      formattedId = id;
    }

    return NextResponse.json({
      id: formattedId,
      isValid,
      message: isValid
        ? 'เลขบัตรประชาชนถูกต้องตาม Check Digit Algorithm'
        : 'เลขบัตรประชาชนไม่ถูกต้อง'
    });
  } catch (error) {
    console.error('Error validating Thai ID:', error);
    return NextResponse.json(
      { error: 'Failed to validate Thai ID' },
      { status: 500 }
    );
  }
}
