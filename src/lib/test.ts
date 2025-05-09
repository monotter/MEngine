import { mat4, vec3, vec4 } from 'gl-matrix'
import ComputeShaderCode from './Shaders/ComputeTransform.wgsl?raw';
import VertexFragmentShaderCode from './Shaders/VertexFragmentShader.wgsl?raw';

// WebGPU Initialization
async function initWebGPU() {
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        throw new Error("Failed to get GPU device.");
    }

    return { device };
}

const { device } = await initWebGPU();
const canvas = document.querySelector('canvas')!;
const context = canvas.getContext('webgpu')!
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device,
  format: presentationFormat,
});

const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();

mat4.perspective(projectionMatrix, Math.PI / 4, 1, 0.1, 100);
mat4.lookAt(viewMatrix, vec3.fromValues(0, 5, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 1));

const object1 = {
    Transform: mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -5, 1,
    ),
    Verticies: [
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(1, 0, 0),
        vec3.fromValues(0, 1, 0),
    ],
    Material: {
        Color: vec4.fromValues(1, 0, 0, 1),
    }
}

const object2 = {
    Transform: mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ),
    Verticies: [
        vec3.fromValues(-0.5, -0.5, 0),
        vec3.fromValues(-0.5, 0.5, 0),
        vec3.fromValues(0.5, -0.5, 0),
        vec3.fromValues(0.5, 0.5, 0),
    ],
    Material: {
        Color: vec4.fromValues(0, 1, 0, 1),
    }
}

const ProjectionMatrixData = new Float32Array(projectionMatrix);
const ViewTransformMatrixData = new Float32Array(viewMatrix);
const ModelTransformMatrixsesArrayData = new Float32Array([
    ...object1.Transform,
    ...object2.Transform,
]);
const ModelCount = 2;
const matrixSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;

//#region ComputeShaderStuff
const ProjectionBuffer = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(ProjectionBuffer, 0, ProjectionMatrixData);


const ViewTransformBuffer = device.createBuffer({
    size: matrixSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(ViewTransformBuffer, 0, ViewTransformMatrixData);


const ModelTransformMatrixsesArrayBuffer = device.createBuffer({
    size: ModelCount * matrixSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(ModelTransformMatrixsesArrayBuffer, 0, ModelTransformMatrixsesArrayData);

const ComputeWriteBindGroupLayout = device.createBindGroupLayout({
    label: 'ViewTransformBufferBindGroupLayout',
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: 'read-only-storage', // Düzeltilmiş
            },
        },
        {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: 'read-only-storage', // Düzeltilmiş
            },
        },
        {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: 'read-only-storage', // Düzeltilmiş
            },
        },
    ]
})
const ComputeWriteBindGroup = device.createBindGroup({
    label: 'ComputeBindGroup',
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
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, // Sadece STORAGE ve COPY_SRC
});

const ComputeReadBindGroupLayout = device.createBindGroupLayout({
    label: 'ComputeReadBindGroupLayout',
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: 'storage', // Düzeltilmiş
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
const vertexShaderModule = device.createShaderModule({
    code: VertexFragmentShaderCode,
});
const vertexBufferLayout = {
    arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
    attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        },
    ],
};
//#endregion

const ComputePipeLineLayout = device.createPipelineLayout({
    label: 'PipelineLayout',
    bindGroupLayouts: [ ComputeWriteBindGroupLayout, ComputeReadBindGroupLayout ],
});
const ComputePipeLine = device.createComputePipeline({
    label: 'PipeLine',
    layout: pipelineLayout,
    compute: {
        module: device.createShaderModule({
            code: ComputeShaderCode,
        }),
        entryPoint: 'main',
    },
});

const encoder = device.createCommandEncoder({ label: 'compute encoder' });
const pass = encoder.beginComputePass({ label: 'compute pass' });
pass.setPipeline(ComputePipeLine);
pass.setBindGroup(0, ComputeWriteBindGroup);
pass.setBindGroup(1, ComputeReadBindGroup);
pass.dispatchWorkgroups(ModelCount, 1, 1);
pass.end();

const renderpass = encoder.beginRenderPass({

})
renderpass.drawIndexed(,,,,)

const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);