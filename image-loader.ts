import type { ImageLoaderProps } from 'next/image';

const normalizeSrc = (src: string) => {
	return src.startsWith('/') ? src.slice(1) : src;
};

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
	const params = ['f=auto', `w=${width}`];
	if (quality) {
		params.push(`q=${quality}`);
	}
	if (process.env.NODE_ENV === 'development') {
		// Serve the original image when using `next dev`
		return `${src}?${params.join('&')}`;
	}
	return `/cdn-cgi/image/${params.join(',')}/${normalizeSrc(src)}`;
}
