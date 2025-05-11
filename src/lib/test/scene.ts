import { mat4, vec2, vec3, vec4 } from 'gl-matrix';

// Interfaces for object and material definitions
interface BaseMaterial {
    Color: vec4;
    TextureURL: string;
}

export interface NewObjectConfig {
    id?: string; // Optional: if not provided, will be auto-generated
    Transform: mat4;
    VertexPairs: [vec3, vec2][]; // Array of [position_vec3, uv_vec2] pairs
    VertexNormals?: vec3[];      // Optional: per-vertex normals, matches length of VertexPairs
    Material: BaseMaterial;
    primitiveType: 'triangle' | 'quad';
    faceNormal?: vec3; // Optional: Single normal for all vertices of this object, fallback if VertexNormals not provided
}

interface ManagedSceneObject extends NewObjectConfig {
    id: string;
    sceneIndex: number; // Index in scene arrays (for MVP, Material, Texture array layer)
}

export class SceneManager {
    public objects: ManagedSceneObject[] = [];
    public modelCount: number = 0;

    public modelTransformMatricesArrayData!: Float32Array;
    public vertexDataArray!: Float32Array;
    public materialColorsData!: Float32Array;
    public textureURLs: string[] = []; // URLs for the TextureImporter, order matches sceneIndex

    public dataVersion: number = 0; // Increments on data change
    private nextIdCounter: number = 0;

    constructor() {
        this._addInitialObjects();
        if (this.objects.length === 0) { 
            this._updateGpuData(); 
        }
    }

    private _generateId(): string {
        return `object-${this.nextIdCounter++}`;
    }

    private _addInitialObjects() {
        const initialObject1: NewObjectConfig = {
            id: 'initial-triangle',
            Transform: mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, -5, 1
            ),
            VertexPairs: [
                [vec3.fromValues(0, 0, 0), vec2.fromValues(0, 0)],
                [vec3.fromValues(1, 0, 0), vec2.fromValues(1, 0)],
                [vec3.fromValues(0, 1, 0), vec2.fromValues(0, -1)]
            ],
            Material: { Color: vec4.fromValues(1, 0, 0, 1), TextureURL: "https://picsum.photos/500/501" },
            primitiveType: 'triangle',
            faceNormal: vec3.fromValues(0, 0, 1)
        };

        const initialObject2: NewObjectConfig = {
            id: 'initial-quad',
            Transform: mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                2, 0, 0, 1
            ),
            VertexPairs: [
                [vec3.fromValues(-0.5, -0.5, 0), vec2.fromValues(1.0, 1.0)],
                [vec3.fromValues(-0.5, 0.5, 0),  vec2.fromValues(1.0, 0.0)],
                [vec3.fromValues(0.5, -0.5, 0),  vec2.fromValues(0.0, 1.0)],
                [vec3.fromValues(0.5, 0.5, 0),   vec2.fromValues(0.0, 0.0)]
            ],
            Material: { Color: vec4.fromValues(0, 1, 0, 1), TextureURL: "https://picsum.photos/500/501" },
            primitiveType: 'quad',
            faceNormal: vec3.fromValues(0, 0, 1)
        };

        this.addObject(initialObject1);
        this.addObject(initialObject2);

        // --- BEGIN CUBE DEFINITION ---
        const s = 0.5;
        const cubeVertices: vec3[] = [
            vec3.fromValues(-s, -s,  s), // 0: Front Bottom Left
            vec3.fromValues( s, -s,  s), // 1: Front Bottom Right
            vec3.fromValues( s,  s,  s), // 2: Front Top Right
            vec3.fromValues(-s,  s,  s), // 3: Front Top Left
            vec3.fromValues(-s, -s, -s), // 4: Back Bottom Left
            vec3.fromValues( s, -s, -s), // 5: Back Bottom Right
            vec3.fromValues( s,  s, -s), // 6: Back Top Right
            vec3.fromValues(-s,  s, -s)  // 7: Back Top Left
        ];

        const cubeUVs: vec2[] = [
            vec2.fromValues(0, 0), // 0: Bottom Left
            vec2.fromValues(1, 0), // 1: Bottom Right
            vec2.fromValues(1, 1), // 2: Top Right
            vec2.fromValues(0, 1)  // 3: Top Left
        ];

        const cubeNormals = {
            front:  vec3.fromValues(0, 0,  1),
            back:   vec3.fromValues(0, 0, -1),
            top:    vec3.fromValues(0,  1,  0),
            bottom: vec3.fromValues(0, -1,  0),
            right:  vec3.fromValues( 1,  0,  0),
            left:   vec3.fromValues(-1,  0,  0)
        };

        const cubeVertexPairs: [vec3, vec2][] = [];
        const cubeVertexNormals: vec3[] = [];

        // Helper to add a triangle's data
        const addTriangle = (p1: vec3, p2: vec3, p3: vec3, uv1: vec2, uv2: vec2, uv3: vec2, normal: vec3) => {
            cubeVertexPairs.push([p1, uv1], [p2, uv2], [p3, uv3]);
            cubeVertexNormals.push(normal, normal, normal);
        };

        // Front face (+Z)
        addTriangle(cubeVertices[0], cubeVertices[1], cubeVertices[2], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.front);
        addTriangle(cubeVertices[0], cubeVertices[2], cubeVertices[3], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.front);

        // Back face (-Z)
        addTriangle(cubeVertices[4], cubeVertices[5], cubeVertices[6], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.back);
        addTriangle(cubeVertices[4], cubeVertices[6], cubeVertices[7], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.back);

        // Top face (+Y)
        addTriangle(cubeVertices[3], cubeVertices[2], cubeVertices[6], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.top);
        addTriangle(cubeVertices[3], cubeVertices[6], cubeVertices[7], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.top);

        // Bottom face (-Y)
        addTriangle(cubeVertices[4], cubeVertices[0], cubeVertices[1], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.bottom);
        addTriangle(cubeVertices[4], cubeVertices[1], cubeVertices[5], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.bottom);

        // Right face (+X)
        addTriangle(cubeVertices[1], cubeVertices[5], cubeVertices[6], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.right);
        addTriangle(cubeVertices[1], cubeVertices[6], cubeVertices[2], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.right);

        // Left face (-X)
        addTriangle(cubeVertices[4], cubeVertices[7], cubeVertices[3], cubeUVs[0], cubeUVs[1], cubeUVs[2], cubeNormals.left);
        addTriangle(cubeVertices[4], cubeVertices[3], cubeVertices[0], cubeUVs[0], cubeUVs[2], cubeUVs[3], cubeNormals.left);

        const cubeBaseTransform = mat4.create();
        mat4.translate(cubeBaseTransform, cubeBaseTransform, vec3.fromValues(-1.5, 0.5, -2)); // Positioned cube

        const cubeMaterial: BaseMaterial = {
            Color: vec4.fromValues(0.3, 0.6, 0.9, 1.0),
            TextureURL: "https://picsum.photos/256/256"
        };

        const cubeObject: NewObjectConfig = {
            id: 'cube-object',
            Transform: cubeBaseTransform,
            VertexPairs: cubeVertexPairs,
            VertexNormals: cubeVertexNormals,
            Material: cubeMaterial,
            primitiveType: 'triangle',
            // faceNormal is not needed as VertexNormals are provided
        };
        this.addObject(cubeObject);
        // --- END CUBE DEFINITION ---
    }

    public addObject(config: NewObjectConfig): ManagedSceneObject | undefined {
        const newId = config.id || this._generateId();
        if (this.objects.some(obj => obj.id === newId)) {
            console.warn(`Object with id ${newId} already exists. Not adding.`);
            return this.objects.find(obj => obj.id === newId);
        }

        const sceneIndex = this.objects.length;

        const managedObject: ManagedSceneObject = {
            ...config,
            id: newId,
            sceneIndex: sceneIndex,
        };

        this.objects.push(managedObject);
        this.modelCount = this.objects.length;
        this._updateGpuData();
        return managedObject;
    }

    public removeObject(id: string): boolean {
        const objectIndex = this.objects.findIndex(obj => obj.id === id);
        if (objectIndex === -1) {
            console.warn(`Object with id ${id} not found for removal.`);
            return false;
        }

        this.objects.splice(objectIndex, 1);

        for (let i = objectIndex; i < this.objects.length; i++) {
            this.objects[i].sceneIndex = i;
        }

        this.modelCount = this.objects.length;
        this._updateGpuData();
        return true;
    }

    private _updateGpuData() {
        if (!this.objects.length) return;

        this.modelCount = this.objects.length;
        // Allocate/Reallocate arrays based on current object count and vertex count
        // These arrays are members of SceneManager
        this.modelTransformMatricesArrayData = new Float32Array(this.modelCount * 16);
        this.materialColorsData = new Float32Array(this.modelCount * 4); // For material color
        // TextureURLs array is already managed by addObject/removeObject

        const totalVertices = this.getTotalVertexCount();
        this.vertexDataArray = new Float32Array(totalVertices * (3 + 2 + 3 + 1 + 1)); // pos(3) + uv(2) + normal(3) + modelIdx(1) + materialIdx(1)

        let currentVertexOffset = 0;
        let currentModelMatrixOffset = 0;
        let currentMaterialColorOffset = 0;

        // Temporary array for texture URLs to ensure correct order for TextureImporter
        const currentTextureURLs: string[] = [];

        this.objects.forEach((object, sceneIndex) => {
            object.sceneIndex = sceneIndex; // Ensure sceneIndex is up-to-date

            // Update ModelTransformMatrix
            this.modelTransformMatricesArrayData.set(object.Transform, currentModelMatrixOffset);
            currentModelMatrixOffset += 16;

            // Update Material Color Data (used by MaterialStruct in shader)
            this.materialColorsData.set(object.Material.Color, currentMaterialColorOffset);
            currentMaterialColorOffset += 4;
            currentTextureURLs.push(object.Material.TextureURL);


            // Populate Vertex Data
            const vertexData = this.vertexDataArray; // Use the class member directly
            let materialGpuIndex = sceneIndex; // Assuming one material struct per object, indexed by sceneIndex

            if (object.primitiveType === 'triangle') {
                for (let i = 0; i < object.VertexPairs.length; i++) {
                    const [pos, uv] = object.VertexPairs[i];
                    vertexData.set(pos, currentVertexOffset); currentVertexOffset += 3;
                    vertexData.set(uv, currentVertexOffset); currentVertexOffset += 2;

                    let normalToUse: vec3;
                    if (object.VertexNormals && object.VertexNormals.length === object.VertexPairs.length) {
                        normalToUse = object.VertexNormals[i];
                    } else if (object.faceNormal) {
                        normalToUse = object.faceNormal;
                    } else {
                        normalToUse = vec3.fromValues(0, 0, 1); // Default normal
                    }
                    vertexData.set(normalToUse, currentVertexOffset); currentVertexOffset += 3;
                    vertexData.set([sceneIndex], currentVertexOffset); currentVertexOffset += 1; // ModelViewProjectIndex
                    vertexData.set([materialGpuIndex], currentVertexOffset); currentVertexOffset += 1; // MaterialIndex
                }
            } else if (object.primitiveType === 'quad') {
                // A quad is made of 4 vertices, forming two triangles (6 vertices for the buffer)
                for (let j = 0; j < object.VertexPairs.length; j += 4) {
                    const p = [object.VertexPairs[j][0], object.VertexPairs[j+1][0], object.VertexPairs[j+2][0], object.VertexPairs[j+3][0]];
                    const u = [object.VertexPairs[j][1], object.VertexPairs[j+1][1], object.VertexPairs[j+2][1], object.VertexPairs[j+3][1]];

                    let normsSource: vec3[];
                    if (object.VertexNormals && object.VertexNormals.length === object.VertexPairs.length) { // Check length against VertexPairs
                        normsSource = [object.VertexNormals[j], object.VertexNormals[j+1], object.VertexNormals[j+2], object.VertexNormals[j+3]];
                    } else {
                        const fn = object.faceNormal || vec3.fromValues(0,0,1); // Default if no specific normal
                        normsSource = [fn,fn,fn,fn];
                    }

                    const quadCornersData = [
                        { pos: p[0], uv: u[0], norm: normsSource[0] },
                        { pos: p[1], uv: u[1], norm: normsSource[1] },
                        { pos: p[2], uv: u[2], norm: normsSource[2] },
                        { pos: p[3], uv: u[3], norm: normsSource[3] },
                    ];

                    // Triangle 1: corners 0, 1, 2
                    // Triangle 2: corners 0, 2, 3
                    const triangleVertices = [
                        quadCornersData[0], quadCornersData[1], quadCornersData[2],
                        quadCornersData[0], quadCornersData[2], quadCornersData[3],
                    ];

                    for (const vert of triangleVertices) {
                        vertexData.set(vert.pos, currentVertexOffset); currentVertexOffset += 3;
                        vertexData.set(vert.uv, currentVertexOffset); currentVertexOffset += 2;
                        vertexData.set(vert.norm, currentVertexOffset); currentVertexOffset += 3;
                        vertexData.set([sceneIndex], currentVertexOffset); currentVertexOffset += 1; // ModelViewProjectIndex
                        vertexData.set([materialGpuIndex], currentVertexOffset); currentVertexOffset += 1; // MaterialIndex
                    }
                }
            }
        });
        this.textureURLs = currentTextureURLs; // Update the main textureURLs list

        this.dataVersion++; // Increment data version to signal changes
    }

    public getTotalVertexCount(): number {
        let count = 0;
        for (const obj of this.objects) {
            if (obj.primitiveType === 'triangle') {
                count += obj.VertexPairs.length; // Each entry in VertexPairs is a vertex
            } else if (obj.primitiveType === 'quad') {
                // Each quad (4 VertexPairs entries, e.g., v0,v1,v2,v3) becomes 2 triangles (6 vertices for the buffer)
                count += (obj.VertexPairs.length / 4) * 6;
            }
        }
        return count;
    }
}

export const scene = new SceneManager();