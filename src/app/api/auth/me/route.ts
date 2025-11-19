import { getCurrentUser } from '@/lib/auth/auth-utils';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const user = await getCurrentUser();
		return NextResponse.json(user);
	} catch (error) {
		console.error('Error getting current user:', error);
		return NextResponse.json(null, { status: 401 });
	}
}
