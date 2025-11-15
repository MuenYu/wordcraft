import { getCurrentUser } from '@/modules/auth/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		return NextResponse.json(user);
	} catch (error) {
		console.error('Error getting current user:', error);
		return NextResponse.json(null, { status: 401 });
	}
}
