import SignUpPage from '@/modules/auth/signup.page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sign up | WordCraft',
};

export default function Page() {
	return <SignUpPage />;
}
