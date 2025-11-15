'use client';

import { Home, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export function Navigation() {
	const { user, isLoading, logout } = useAuth();

	return (
		<nav className="border-b bg-white sticky top-0 z-50">
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-6">
						<Link href="/" className="text-xl font-bold text-gray-900">
							WordCraft
						</Link>
						{user && (
							<div className="items-center space-x-4 hidden md:flex">
								<Link href="/dashboard">
									<Button variant="ghost" size="sm">
										<Home className="mr-2 h-4 w-4" />
										Dashboard
									</Button>
								</Link>
							</div>
						)}
					</div>
					{!isLoading && (
						<div>
							{user ? (
								<Button variant="ghost" size="sm" onClick={logout}>
									Log Out <LogOut className="size-4" />
								</Button>
							) : (
								<Link href="/login">
									<Button variant="ghost" size="sm">
										Log In <LogIn className="size-4" />
									</Button>
								</Link>
							)}
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}
