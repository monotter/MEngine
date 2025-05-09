import { mat4 } from 'gl-matrix';

export async function initWebGPU() {
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

export function configureCanvas(device: GPUDevice, canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgpu')!;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });
    return { context, presentationFormat };
}

export function createProjectionMatrix(canvas: HTMLCanvasElement) {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    return projectionMatrix;
}
