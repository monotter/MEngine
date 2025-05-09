import { mat4, vec3, vec4 } from 'gl-matrix';
import { CameraControls } from './CameraControls';
import { initWebGPU, configureCanvas, createProjectionMatrix } from '../webgpuUtils';
import { object1, object2, ModelCount, ModelTransformMatrixsesArrayData, vertexDataArray, materialColorsData } from './scene';
import ComputeShaderCode from '$lib/Shaders/ComputeTransform.wgsl?raw';
import VertexFragmentShaderCode from '$lib/Shaders/VertexFragment.wgsl?raw';

async function main() {
    const { device } = await initWebGPU();
    const canvas = document.querySelector('canvas')!;
    const { context, presentationFormat } = configureCanvas(device, canvas);

    let projectionMatrix = createProjectionMatrix(canvas);

    const cameraControls = new CameraControls(canvas);
    cameraControls.setInitialPosition(10, 0, Math.PI / 2, vec3.fromValues(0, 0, 0));

    const matrixSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT; // 64 bytes

    //#region ComputeShaderStuff
    const ProjectionBuffer = device.createBuffer({
        size: matrixSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(ProjectionBuffer, 0, projectionMatrix as Float32Array);

    const ViewTransformBuffer = device.createBuffer({
        size: matrixSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const ModelTransformMatrixsesArrayBuffer = device.createBuffer({
        size: ModelCount * matrixSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(ModelTransformMatrixsesArrayBuffer, 0, ModelTransformMatrixsesArrayData);

    const ComputeWriteBindGroupLayout = device.createBindGroupLayout({
        label: 'ComputeWriteBindGroupLayout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'read-only-storage',
                },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'read-only-storage',
                },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'read-only-storage',
                },
            },
        ]
    })
    const ComputeWriteBindGroup = device.createBindGroup({
        label: 'ComputeWriteBindGroup',
        layout: ComputeWriteBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: ProjectionBuffer },
            },
            {
                binding: 1,
                resource: { buffer: ViewTransformBuffer },
            },
            {
                binding: 2,
                resource: { buffer: ModelTransformMatrixsesArrayBuffer },
            },
        ],
    });

    const ModelViewProjectArrayBuffer = device.createBuffer({
        size: ModelCount * matrixSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const ComputeReadBindGroupLayout = device.createBindGroupLayout({
        label: 'ComputeReadBindGroupLayout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'storage',
                },
            },
        ]
    })
    const ComputeReadBindGroup = device.createBindGroup({
        label: 'ComputeReadBindGroup',
        layout: ComputeReadBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: ModelViewProjectArrayBuffer },
            },
        ],
    });
    //#endregion

    //#region VertexFragmentShaderStuff
    const vertexData = new Float32Array(vertexDataArray);
    const vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: (3 + 2 + 3 + 1 + 1) * 4, // 40 bytes
        attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // Position
            { shaderLocation: 1, offset: 3 * 4, format: 'float32x2' }, // UV
            { shaderLocation: 2, offset: (3 + 2) * 4, format: 'float32x3' }, // Normal
            { shaderLocation: 3, offset: (3 + 2 + 3) * 4, format: 'uint32' }, // MVP Index
            { shaderLocation: 4, offset: (3 + 2 + 3 + 1) * 4, format: 'uint32' }, // Material Index
        ],
    };

    const materialBuffer = device.createBuffer({
        size: materialColorsData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(materialBuffer, 0, materialColorsData);

    const materialBindGroupLayout = device.createBindGroupLayout({
        label: 'MaterialBindGroupLayout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'read-only-storage' },
        }],
    });
    const materialBindGroup = device.createBindGroup({
        label: 'MaterialBindGroup',
        layout: materialBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: materialBuffer } }],
    });

    const mvpResultBindGroupLayout = device.createBindGroupLayout({
        label: 'MVPResultBindGroupLayout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' },
        }],
    });
    const mvpResultBindGroup = device.createBindGroup({
        label: 'MVPResultBindGroup',
        layout: mvpResultBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: ModelViewProjectArrayBuffer } }],
    });

    const renderPipelineLayout = device.createPipelineLayout({
        label: 'RenderPipelineLayout',
        bindGroupLayouts: [materialBindGroupLayout, mvpResultBindGroupLayout],
    });

    const vertexShaderModule = device.createShaderModule({
        code: VertexFragmentShaderCode,
    });

    const renderPipeline = device.createRenderPipeline({
        label: 'RenderPipeline',
        layout: renderPipelineLayout,
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'main',
            buffers: [vertexBufferLayout],
        },
        fragment: {
            module: vertexShaderModule, 
            entryPoint: 'fragment_main',
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            topology: 'triangle-list',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });

    const ComputePipeLineLayout = device.createPipelineLayout({
        label: 'ComputePipelineLayout',
        bindGroupLayouts: [ ComputeWriteBindGroupLayout, ComputeReadBindGroupLayout ],
    });
    const ComputePipeLine = device.createComputePipeline({
        label: 'ComputePipeline',
        layout: ComputePipeLineLayout,
        compute: {
            module: device.createShaderModule({
                code: ComputeShaderCode,
            }),
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

        const encoder = device.createCommandEncoder({ label: 'frame encoder' });

        const computePass = encoder.beginComputePass({ label: 'compute pass' });
        computePass.setPipeline(ComputePipeLine);
        computePass.setBindGroup(0, ComputeWriteBindGroup);
        computePass.setBindGroup(1, ComputeReadBindGroup);
        computePass.dispatchWorkgroups(ModelCount, 1, 1);
        computePass.end();

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
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setBindGroup(0, materialBindGroup);
        renderPass.setBindGroup(1, mvpResultBindGroup);
        renderPass.draw(vertexData.length / ((3 + 2 + 3 + 1 + 1)), 1, 0, 0); // Dinamik vertex sayısı
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

main();
