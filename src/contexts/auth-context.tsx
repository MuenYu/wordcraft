'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
	id: string;
	name: string | null;
	email: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	checkAuth: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const checkAuth = async () => {
		try {
			setIsLoading(true);
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const userData = await response.json();
				setUser(userData as User);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('Error checking auth:', error);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			const response = await fetch('/api/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				setUser(null);
				window.location.href = '/';
			} else {
				console.error('Logout failed:', response.statusText);
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	useEffect(() => {
		checkAuth();
	}, []);

	return <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
