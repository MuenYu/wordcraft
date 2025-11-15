import { BookOpen, Globe, Brain } from 'lucide-react';
import Image from 'next/image';
import { Navigation } from '@/components/navigation';

export default async function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			<Navigation />
			<div className="container mx-auto py-12 px-4">
				<div className="text-center mb-12">
					<Image src="/logo.png" alt="WordCraft Logo" width={600} height={400} className="mx-auto mb-6" />
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to WordCraft</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						An interactive language learning platform that helps you master vocabulary through AI-powered analysis and contextual learning.
					</p>
				</div>

				<div className="mt-16 text-center">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
					<div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
						<div className="text-center">
							<div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
								<BookOpen className="h-6 w-6 text-blue-600" />
							</div>
							<h3 className="font-semibold mb-2">Vocabulary Import</h3>
							<p className="text-gray-600 text-sm">Import word lists with contextual sentences for personalized learning</p>
						</div>
						<div className="text-center">
							<div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
								<Brain className="h-6 w-6 text-green-600" />
							</div>
							<h3 className="font-semibold mb-2">AI Analysis</h3>
							<p className="text-gray-600 text-sm">Get detailed word meanings, usage patterns, and examples powered by AI</p>
						</div>
						<div className="text-center">
							<div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
								<Globe className="h-6 w-6 text-purple-600" />
							</div>
							<h3 className="font-semibold mb-2">Interactive Learning</h3>
							<p className="text-gray-600 text-sm">Practice with contextual sentences and get instant AI feedback</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
