import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import("next").NextConfig} */
const nextConfig = {
	/* config options here */
	images: {
		loader: 'custom',
		loaderFile: './image-loader.ts',
	},
};

if (process.env.NODE_ENV === 'development') {
	initOpenNextCloudflareForDev();
}

export default nextConfig;
