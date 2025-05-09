import { mat4, vec3, vec4 } from 'gl-matrix';

export const object1 = {
    Transform: mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -5, 1, // Z ekseninde biraz geriye taşı
    ),
    Verticies: [
        vec3.fromValues(0, 0, 0),   // Orijin
        vec3.fromValues(1, 0, 0),   // X ekseninde 1 birim
        vec3.fromValues(0, 1, 0),   // Y ekseninde 1 birim
    ],
    Material: {
        Color: vec4.fromValues(1, 0, 0, 1), // Kırmızı
    }
};

export const object2 = {
    Transform: mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        2, 0, 0, 1, // X ekseninde sağa taşı
    ),
    Verticies: [
        vec3.fromValues(-0.5, -0.5, 0), // Sol alt
        vec3.fromValues(-0.5, 0.5, 0),  // Sol üst
        vec3.fromValues(0.5, -0.5, 0),  // Sağ alt
        vec3.fromValues(0.5, 0.5, 0),   // Sağ üst
    ],
    Material: {
        Color: vec4.fromValues(0, 1, 0, 1), // Yeşil
    }
};

export const ModelCount = 2;

export const ModelTransformMatrixsesArrayData = new Float32Array([
    ...object1.Transform,
    ...object2.Transform,
]);

export const vertexDataArray = [
    // Object 1 (Triangle) - MVP Index 0, Material Index 0
    ...object1.Verticies[0], 0, 0, 0, 0, 1, 0, 0, // Vertex 0
    ...object1.Verticies[1], 1, 0, 0, 0, 1, 0, 0, // Vertex 1
    ...object1.Verticies[2], 0, 1, 0, 0, 1, 0, 0, // Vertex 2

    // Object 2 (Quad - 2 triangles) - MVP Index 1, Material Index 1
    // Tri 1: V0, V1, V2
    ...object2.Verticies[0], 0, 0, 0, 0, 1, 1, 1, // Vertex 0 (-0.5, -0.5, 0)
    ...object2.Verticies[1], 0, 1, 0, 0, 1, 1, 1, // Vertex 1 (-0.5,  0.5, 0)
    ...object2.Verticies[2], 1, 0, 0, 0, 1, 1, 1, // Vertex 2 ( 0.5, -0.5, 0)
    // Tri 2: V1, V3, V2
    ...object2.Verticies[1], 0, 1, 0, 0, 1, 1, 1, // Vertex 1 (-0.5,  0.5, 0)
    ...object2.Verticies[3], 1, 1, 0, 0, 1, 1, 1, // Vertex 3 ( 0.5,  0.5, 0)
    ...object2.Verticies[2], 1, 0, 0, 0, 1, 1, 1, // Vertex 2 ( 0.5, -0.5, 0)
];

export const materialColorsData = new Float32Array([
    ...object1.Material.Color,
    ...object2.Material.Color,
]);
