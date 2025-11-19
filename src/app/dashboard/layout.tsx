import { Navigation } from '@/components/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<Navigation />
			<main className="flex-1">{children}</main>
		</div>
	);
}
