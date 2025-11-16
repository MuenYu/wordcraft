import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/auth-context';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'WordCraft',
	description:
		'An interactive language learning platform that helps you master vocabulary through AI-powered analysis and contextual learning.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
				<AuthProvider>
					<main>{children}</main>
					<Toaster position="bottom-right" />
				</AuthProvider>
			</body>
		</html>
	);
}
