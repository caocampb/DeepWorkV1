import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Redirect any [locale] routes to the root page
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url));
} 