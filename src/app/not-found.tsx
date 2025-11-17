import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata: Metadata = {
	title: '404 | WordCraft',
};

export default function NotFound() {
	return (
		<div className="flex flex-col lg:flex-row items-center justify-center min-h-screen px-4 gap-8 lg:gap-16">
			{/* Desktop/Tablet: Mascot on left */}
			<div className="hidden lg:block">
				<Image src="/mascot.png" alt="WordCraft Mascot" width={400} height={400} className="w-auto h-auto max-w-lg" />
			</div>

			{/* Mobile: Logo on top */}
			<div className="lg:hidden">
				<Image src="/logo.png" alt="WordCraft Logo" width={600} height={400} className="w-auto h-auto max-w-xs mb-8" />
			</div>

			{/* 404 content */}
			<div className="text-center lg:text-left max-w-md">
				<h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

				<h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>

				<p className="text-gray-600 mb-8">Hmm, guess where did I hide this page?</p>

				<Link
					href="/"
					className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
				>
					<Home className="h-4 w-4" />
					Back to Home
				</Link>
			</div>
		</div>
	);
}
