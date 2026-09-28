import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_SESSION = 'mcc_session';
const CHEMINS_PUBLICS = ['/connexion', '/installation'];

// Premier filtre seulement : il ne vérifie que la présence du cookie de session. Chaque page
// et chaque action serveur revalide la session en base.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (CHEMINS_PUBLICS.some((chemin) => pathname === chemin || pathname.startsWith(`${chemin}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.has(COOKIE_SESSION)) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = '/connexion';
  destination.search = '';
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
