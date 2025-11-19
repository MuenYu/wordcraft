import { signOut } from '@/app/auth/actions/auth.action';
import { NextResponse } from 'next/server';

export async function POST() {
	try {
		const result = await signOut();

		if (result.success) {
			return NextResponse.json({ success: true, message: result.message });
		} else {
			return NextResponse.json({ success: false, message: result.message }, { status: 400 });
		}
	} catch (error) {
		console.error('Logout API error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
