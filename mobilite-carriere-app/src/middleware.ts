import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_SESSION = 'mcc_session';
const CHEMINS_PUBLICS = ['/connexion', '/installation'];

// Premier filtre seulement : le middleware s'exécute sans accès à la base et ne peut donc
// pas valider le jeton. Chaque page et chaque action serveur revalide la session.
export function middleware(request: NextRequest) {
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
