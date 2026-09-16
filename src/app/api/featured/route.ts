import { NextResponse } from 'next/server';
import { getFeaturedPhotos } from '@/lib/photos';

export async function GET() {
  try {
    const photos = await getFeaturedPhotos();
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('GET /api/featured error:', error);
    return NextResponse.json({ photos: [] });
  }
}
