import { LoginForm } from './components/login-form';
import { Navigation } from '@/components/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Login | WordCraft',
};

export default function LoginPage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Navigation />
			<div className="bg-muted flex-1 flex flex-col items-center justify-center gap-6 p-6 md:p-10">
				<div className="flex w-full max-w-sm flex-col gap-6">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
