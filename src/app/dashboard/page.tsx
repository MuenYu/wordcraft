import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Dashboard | WordCraft',
};

export default async function DashboardPage() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
				<p className="text-gray-600 mt-2">Welcome to your dashboard</p>
			</div>
		</div>
	);
}
