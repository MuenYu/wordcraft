import LoginPage from '@/modules/auth/login.page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Login | WordCraft',
};

export default async function Page() {
	return <LoginPage />;
}
