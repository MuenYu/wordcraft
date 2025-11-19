import { type NextRequest, NextResponse } from 'next/server';
import { getAuthInstance as getAuth } from '@/lib/auth/auth-utils';

export async function middleware(request: NextRequest) {
	try {
		// Validate session
		const auth = await getAuth();
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.redirect(new URL('/auth/login', request.url));
		}

		return NextResponse.next();
	} catch (_error) {
		// TODO: to pass lint temporarily
		console.error('Middleware session validation error:', _error);
		// If session validation fails, redirect to login
		return NextResponse.redirect(new URL('/auth/login', request.url));
	}
}

export const config = {
	matcher: [
		'/dashboard/:path*', // Protects /dashboard and all sub-routes
	],
};
