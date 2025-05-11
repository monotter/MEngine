import { mat4, vec3, vec4 } from 'gl-matrix';
import { CameraControls } from './CameraControls';
import { initWebGPU, configureCanvas, createProjectionMatrix } from '../webgpuUtils';
import { scene, type NewObjectConfig } from './scene'; // Import scene instance and NewObjectConfig as type
import ComputeShaderCode from '$lib/Shaders/ComputeTransform.wgsl?raw';
import VertexFragmentShaderCode from '$lib/Shaders/VertexFragment.wgsl?raw';
import { TextureImporter } from './TextureImporter'; // Import TextureImporter

async function main() {
    const { device } = await initWebGPU();
    const canvas = document.querySelector('canvas')!;
    const { context, presentationFormat } = configureCanvas(device, canvas);

    let projectionMatrix = createProjectionMatrix(canvas);

    const cameraControls = new CameraControls(canvas);
    cameraControls.setInitialPosition(1, 0, Math.PI / 2, vec3.fromValues(0, 0, 0));

    const textureImporter = new TextureImporter(); // TextureImporter instance
    let lastSceneDataVersion = -1; // To track changes in scene data

    // Buffers will be declared here and potentially re-created if scene.dataVersion changes
    let ProjectionBuffer: GPUBuffer; // yansima matrisinin verisi
    let ViewTransformBuffer: GPUBuffer; // kamera matrisinin verisi
    let ModelTransformMatrixsesArrayBuffer: GPUBuffer; // modellerin transform matrislerinin verisi
    let ModelViewProjectArrayBuffer: GPUBuffer; // model-view-projection matrisinin verisi
    let vertexBuffer: GPUBuffer; // tum vertexlerin verisi
    let materialBuffer: GPUBuffer; // tum materyallerin verisi
    let textureArray: GPUTexture; // Tum texturelarin array halinde verisi
    let textureSampler: GPUSampler; // texturelarin sampleri
    let materialBindGroup: GPUBindGroup; // material bind grubu
    let mvpResultBindGroup: GPUBindGroup; // model-view-projection matrisinin bind grubu
    let ComputeWriteBindGroup: GPUBindGroup; // Compute shader'a yazilacak verilerin bind grubu
    let ComputeReadBindGroup: GPUBindGroup;

    async function setupSceneResources() {
        // oncesinde sahnedeki kaydedilmis tum texture url'lerini importla
        const textureBitMaps = await textureImporter.loadImages(scene.textureURLs);
        // 10 lu sistem yapilacak
        if (textureArray) textureArray.destroy(); // onceki texture arrayini yok et
        if (textureBitMaps.length > 0) {
            textureArray = device.createTexture({
                size: [textureBitMaps[0].width, textureBitMaps[0].height, textureBitMaps.length],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });

            textureBitMaps.forEach((bitmap, i) => {
                device.queue.copyExternalImageToTexture(
                    { source: bitmap },
                    { texture: textureArray, origin: [0, 0, i] },
                    [bitmap.width, bitmap.height, 1]
                );
                bitmap.close();
            });
        } else {
            // Create a dummy 1x1 texture if no URLs, to prevent binding errors
            textureArray = device.createTexture({
                size: [1, 1, 1],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
             // Optionally fill with a default color, e.g., white
            const whitePixel = new Uint8Array([255, 255, 255, 255]);
            device.queue.writeTexture(
                { texture: textureArray },
                whitePixel,
                { bytesPerRow: 4, rowsPerImage: 1 },
                { width: 1, height: 1, depthOrArrayLayers: 1 }
            );
        }

        if (!textureSampler) { // Sampler can usually be created once
            textureSampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
                addressModeU: 'repeat',
                addressModeV: 'repeat',
            });
        }

        const matrixSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;

        // Destroy old buffers before creating new ones
        if (ProjectionBuffer) ProjectionBuffer.destroy();
        ProjectionBuffer = device.createBuffer({
            size: matrixSize, // Projection matrix is single
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        // Initial write, will be updated on resize
        device.queue.writeBuffer(ProjectionBuffer, 0, projectionMatrix as Float32Array);

        if (ViewTransformBuffer) ViewTransformBuffer.destroy();
        ViewTransformBuffer = device.createBuffer({
            size: matrixSize, // View matrix is single
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        // Initial write, cameraControls.getViewMatrix() will update it per frame

        if (ModelTransformMatrixsesArrayBuffer) ModelTransformMatrixsesArrayBuffer.destroy();
        ModelTransformMatrixsesArrayBuffer = device.createBuffer({
            // size: scene.modelCount * matrixSize,
             size: Math.max(1, scene.modelCount) * matrixSize, // Ensure buffer is not zero-sized
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        if (scene.modelCount > 0) {
            device.queue.writeBuffer(ModelTransformMatrixsesArrayBuffer, 0, scene.modelTransformMatricesArrayData);
        }

        if (ModelViewProjectArrayBuffer) ModelViewProjectArrayBuffer.destroy();
        ModelViewProjectArrayBuffer = device.createBuffer({
            // size: scene.modelCount * matrixSize,
            size: Math.max(1, scene.modelCount) * matrixSize, // Ensure buffer is not zero-sized
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        if (vertexBuffer) vertexBuffer.destroy();
        vertexBuffer = device.createBuffer({
            // size: scene.vertexDataArray.byteLength,
            size: Math.max(1, scene.vertexDataArray.byteLength), // Ensure buffer is not zero-sized
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        if (scene.vertexDataArray.byteLength > 0) {
            device.queue.writeBuffer(vertexBuffer, 0, scene.vertexDataArray);
        }

        if (materialBuffer) materialBuffer.destroy();
        materialBuffer = device.createBuffer({
            // size: scene.materialColorsData.byteLength,
            size: Math.max(1, scene.materialColorsData.byteLength), // Ensure buffer is not zero-sized
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        if (scene.materialColorsData.byteLength > 0) {
            device.queue.writeBuffer(materialBuffer, 0, scene.materialColorsData);
        }

        // Recreate bind groups as their resources might have changed
        // Assuming layouts are defined globally or within this scope and don't change
        ComputeWriteBindGroup = device.createBindGroup({
            label: 'ComputeWriteBindGroup',
            layout: ComputeWriteBindGroupLayout, // Assume this layout is defined
            entries: [
                { binding: 0, resource: { buffer: ProjectionBuffer } },
                { binding: 1, resource: { buffer: ViewTransformBuffer } },
                { binding: 2, resource: { buffer: ModelTransformMatrixsesArrayBuffer } },
            ],
        });

        ComputeReadBindGroup = device.createBindGroup({
            label: 'ComputeReadBindGroup',
            layout: ComputeReadBindGroupLayout, // Assume this layout is defined
            entries: [
                { binding: 0, resource: { buffer: ModelViewProjectArrayBuffer } },
            ],
        });

        materialBindGroup = device.createBindGroup({
            label: 'MaterialBindGroup',
            layout: materialBindGroupLayout, // Assume this layout is defined
            entries: [
                { binding: 0, resource: { buffer: materialBuffer } },
                { binding: 1, resource: textureArray.createView({ dimension: '2d-array' }) },
                { binding: 2, resource: textureSampler },
            ],
        });

        mvpResultBindGroup = device.createBindGroup({
            label: 'MVPResultBindGroup',
            layout: mvpResultBindGroupLayout, // Assume this layout is defined
            entries: [{ binding: 0, resource: { buffer: ModelViewProjectArrayBuffer } }],
        });

        lastSceneDataVersion = scene.dataVersion;
    }

    // Initial setup of resources
    // Definitions for layouts (ComputeWriteBindGroupLayout, etc.) should be here or accessible
    // For brevity, assuming they are defined as they were in the original main.ts
    const ComputeWriteBindGroupLayout = device.createBindGroupLayout({
        label: 'ComputeWriteBindGroupLayout',
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        ]
    });
    const ComputeReadBindGroupLayout = device.createBindGroupLayout({
        label: 'ComputeReadBindGroupLayout',
        entries: [ { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } } ]
    });
    const materialBindGroupLayout = device.createBindGroupLayout({
        label: 'MaterialBindGroupLayout',
        entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '2d-array' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        ],
    });
    const mvpResultBindGroupLayout = device.createBindGroupLayout({
        label: 'MVPResultBindGroupLayout',
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }],
    });
    // ... (rest of the layout definitions if any)

    await setupSceneResources(); // Initial call to setup resources

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: (3 + 2 + 3 + 1 + 1) * 4, // Pos(3) + UV(2) + Normal(3) + MVPIdx(1) + MatIdx(1) = 10 floats * 4 bytes
        attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },       // Position
            { shaderLocation: 1, offset: 3 * 4, format: 'float32x2' },   // UV
            { shaderLocation: 2, offset: (3 + 2) * 4, format: 'float32x3' }, // Normal
            { shaderLocation: 3, offset: (3 + 2 + 3) * 4, format: 'uint32' },  // MVP Index
            { shaderLocation: 4, offset: (3 + 2 + 3 + 1) * 4, format: 'uint32' }, // Material Index
        ],
    };

    const renderPipelineLayout = device.createPipelineLayout({
        label: 'RenderPipelineLayout',
        bindGroupLayouts: [materialBindGroupLayout, mvpResultBindGroupLayout],
    });

    const vertexShaderModule = device.createShaderModule({ code: VertexFragmentShaderCode });
    const fragmentShaderModule = device.createShaderModule({ code: VertexFragmentShaderCode });

    const renderPipeline = device.createRenderPipeline({
        label: 'RenderPipeline',
        layout: renderPipelineLayout,
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'main',
            buffers: [vertexBufferLayout],
        },
        fragment: {
            module: fragmentShaderModule,
            entryPoint: 'fragment_main',
            targets: [{ format: presentationFormat }],
        },
        primitive: { topology: 'triangle-list', cullMode: 'back' },
        depthStencil: { depthWriteEnabled: true, depthCompare: 'less', format: 'depth24plus' },
    });

    const ComputePipeLineLayout = device.createPipelineLayout({
        label: 'ComputePipelineLayout',
        bindGroupLayouts: [ ComputeWriteBindGroupLayout, ComputeReadBindGroupLayout ],
    });
    const ComputePipeLine = device.createComputePipeline({
        label: 'ComputePipeline',
        layout: ComputePipeLineLayout,
        compute: {
            module: device.createShaderModule({ code: ComputeShaderCode }),
            entryPoint: 'main',
        },
    });

    let depthTexture: GPUTexture;

    function ensureDepthTexture() {
        if (!depthTexture || depthTexture.width !== canvas.width || depthTexture.height !== canvas.height) {
            if (depthTexture) {
                depthTexture.destroy();
            }
            depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
    }

    function frame() {
        cameraControls.update(); 

        if (scene.dataVersion !== lastSceneDataVersion) {
            console.log("Scene data changed, re-setting up resources.");
            setupSceneResources(); // Re-setup resources if scene data version changed
        }

        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            projectionMatrix = createProjectionMatrix(canvas); // Projeksiyon matrisini yeniden oluştur
            device.queue.writeBuffer(ProjectionBuffer, 0, projectionMatrix as Float32Array);
            ensureDepthTexture();
        }
        ensureDepthTexture();

        const viewMatrix = cameraControls.getViewMatrix();
        device.queue.writeBuffer(ViewTransformBuffer, 0, viewMatrix as Float32Array);
        // Update ModelTransformMatrixsesArrayBuffer only if there are objects
        if (scene.modelCount > 0 && scene.modelTransformMatricesArrayData.byteLength > 0) {
            device.queue.writeBuffer(ModelTransformMatrixsesArrayBuffer, 0, scene.modelTransformMatricesArrayData);
        }

        const encoder = device.createCommandEncoder({ label: 'frame encoder' });

        // Only run compute pass if there are objects
        if (scene.modelCount > 0) {
            const computePass = encoder.beginComputePass({ label: 'compute pass' });
            computePass.setPipeline(ComputePipeLine);
            computePass.setBindGroup(0, ComputeWriteBindGroup);
            computePass.setBindGroup(1, ComputeReadBindGroup);
            computePass.dispatchWorkgroups(scene.modelCount, 1, 1);
            computePass.end();
        }

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };
        const renderPass = encoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        
        // Only set vertex buffer and draw if there are vertices
        if (scene.vertexDataArray.byteLength > 0) {
            renderPass.setVertexBuffer(0, vertexBuffer);
            renderPass.setBindGroup(0, materialBindGroup);
            renderPass.setBindGroup(1, mvpResultBindGroup);
            renderPass.draw(scene.getTotalVertexCount(), 1, 0, 0);
        }
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

main();
