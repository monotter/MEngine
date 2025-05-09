export class MaterialImporter {
    private static async download(url: string): Promise<Blob> {
        const response: Response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const blob: Blob = await response.blob();
        return blob;
    }
    private static async loadImageBitmap(device: GPUDevice, blob: Blob) {
        const imageData: ImageBitmap = await createImageBitmap(blob);
        const textureDescriptor: GPUTextureDescriptor = {
            size: {
                width: imageData.width,
                height: imageData.height,
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };
        const texture: GPUTexture = device.createTexture(textureDescriptor);
        device.queue.copyExternalImageToTexture(
            { source: imageData },
            { texture: texture },
            textureDescriptor.size
        );
        return texture;
    }
    static async import(url: string, device: GPUDevice): Promise<MaterialType> {
        const blob = await this.download(url);
        const texture = await this.loadImageBitmap(device, blob);
        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "rgba8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1,
        };
        const view = texture.createView(viewDescriptor);
        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1,
        };
        const sampler = device.createSampler(samplerDescriptor);
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },
            ],
        });
        const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: view,
                },
                {
                    binding: 1,
                    resource: sampler,
                },
            ] as GPUBindGroupEntry[],
        });
        return {
            texture,
            view,
            sampler,
            bindGroup,
            bindGroupLayout,
        };
    }
}
