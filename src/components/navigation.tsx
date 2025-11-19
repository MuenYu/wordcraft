'use client';

import { Home, LogIn, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';

export function Navigation() {
	const { user, isLoading, logout } = useAuth();

	return (
		<nav className="border-b bg-white sticky top-0 z-50 h-16">
			<div className="container mx-auto px-4 h-full">
				<div className="flex items-center justify-between h-full">
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

					{/* Desktop menu */}
					{!isLoading && (
						<div className="hidden md:block">
							{user ? (
								<Button variant="ghost" size="sm" onClick={logout}>
									Log Out <LogOut className="size-4" />
								</Button>
							) : (
								<Link href="/auth/login">
									<Button variant="ghost" size="sm">
										Log In <LogIn className="size-4" />
									</Button>
								</Link>
							)}
						</div>
					)}

					{/* Mobile menu */}
					<div className="md:hidden">
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="ghost" size="sm">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right">
								<SheetHeader>
									<SheetTitle>Menu</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col space-y-4">
									{user && (
										<Link href="/dashboard">
											<Button variant="ghost" className="w-full justify-start">
												<Home className="mr-2 h-4 w-4" />
												Dashboard
											</Button>
										</Link>
									)}
									{!isLoading && (
										<>
											{user ? (
												<Button variant="ghost" className="w-full justify-start" onClick={logout}>
													<LogOut className="mr-2 h-4 w-4" />
													Log Out
												</Button>
											) : (
												<Link href="/auth/login">
													<Button variant="ghost" className="w-full justify-start">
														<LogIn className="mr-2 h-4 w-4" />
														Log In
													</Button>
												</Link>
											)}
										</>
									)}
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}
