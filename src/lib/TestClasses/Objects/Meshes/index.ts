import { OBJImporter } from "$lib/TestClasses/Importers";

let GPUDevice: GPUDevice | undefined;
let Cube: MeshType | undefined;
export class Meshes {
    Cube?: MeshType
    static async initialize(device: GPUDevice) {
        GPUDevice = device;
        if (!GPUDevice) {
            throw new Error("GPUDevice is not initialized");
        }
        Cube = await OBJImporter.import('/cube.obj', GPUDevice);
    }
    static get Cube() {
        if (!Cube) {
            throw new Error("Cube is not initialized");
        }
        return Cube;
    }
}