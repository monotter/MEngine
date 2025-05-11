// filepath: /Users/monotter/MEngine/src/lib/test/TextureImporter.ts
export class TextureImporter {

    constructor() {
    }

    async loadImage(url: string): Promise<ImageBitmap> {
        const response = await fetch(url);
        const imageBitmap = await createImageBitmap(await response.blob());

        if (!imageBitmap) {
            throw new Error(`Failed to create ImageBitmap from URL: ${url}`);
        }
        return imageBitmap;
    }

    async loadImages(urls: string[]): Promise<ImageBitmap[]> {
        const imageBitmaps = await Promise.all(
            urls.map(async (url) => {
                const response = await fetch(url);
                return createImageBitmap(await response.blob());
            })
        );

        if (imageBitmaps.length === 0) {
            throw new Error("No images to load into texture array.");
        }

        const width = imageBitmaps[0].width;
        const height = imageBitmaps[0].height;
        const depth = imageBitmaps.length;



        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext('2d');
        if (!ctx) throw new Error("Failed to get 2D context for resizing image.");
        for (let i = 0; i < imageBitmaps.length; i++) {
            if (imageBitmaps[i].width !== width || imageBitmaps[i].height !== height) {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(imageBitmaps[i], 0, 0, width, height);
                imageBitmaps[i] = offscreen.transferToImageBitmap();
            }
        }

        return imageBitmaps;
    }
}
