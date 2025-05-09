import { MaterialImporter } from "$lib/TestClasses/Importers";

let GPUDevice: GPUDevice | undefined;
let PlainMaterial: MaterialType | undefined;
export class Materials {
    PlainMaterial?: MaterialType
    static async initialize(device: GPUDevice) {
        GPUDevice = device;
        if (!GPUDevice) {
            throw new Error("GPUDevice is not initialized");
        }
        PlainMaterial = await MaterialImporter.import('/uv.jpg', GPUDevice)
    }
    static get PlainMaterial() {
        if (!PlainMaterial) {
            throw new Error("PlainMaterial is not initialized");
        }
        return PlainMaterial;
    }
}