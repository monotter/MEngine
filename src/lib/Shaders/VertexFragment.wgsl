struct MaterialStruct {
    Color: vec4<f32>,
    TextureIndex: u32,
};

@group(0) @binding(0) var<storage, read> Materials: array<MaterialStruct>;
// @group(0) @binding(1) var TextureArray: texture_2d_array<f32>;
// @group(0) @binding(2) var TextureSampler: sampler;

@group(1) @binding(0) var<storage, read_write> ModelViewProjectArray: array<mat4x4<f32>>;

// Vertex Input and Output
struct VertexInputStruct {
    @location(0) Position: vec3<f32>,
    @location(1) UVPosition: vec2<f32>,
    @location(2) Normal: vec3<f32>,
    @location(3) ModelViewProjectIndex: u32,
    @location(4) MaterialIndex: u32,
};

struct VertexOutputStruct {
    @builtin(position) Position: vec4<f32>,
    @location(0) TextureCoordinate: vec2<f32>,
    @location(1) Color: vec4<f32>,
    @location(2) Normal: vec3<f32>,
    @interpolate(flat) @location(3) MaterialIndex: u32,
};

@vertex
fn main(Input: VertexInputStruct) -> VertexOutputStruct {
    var Output: VertexOutputStruct;

    // Fetch the model transform matrix
    let ModelViewProjection: mat4x4<f32> = ModelViewProjectArray[Input.ModelViewProjectIndex];

    // Calculate final position in clip space
    Output.Position = ModelViewProjection * vec4<f32>(Input.Position, 1.0);
    Output.TextureCoordinate = Input.UVPosition;
    Output.Normal = Input.Normal;
    Output.Color = Materials[Input.MaterialIndex].Color;
    Output.MaterialIndex = Input.MaterialIndex; // Pass material index to fragment shader
    return Output;
}

@fragment
fn fragment_main(Input: VertexOutputStruct) -> @location(0) vec4<f32> {
    // Fetch the texture using the material index
    let Material = Materials[Input.MaterialIndex];
    // let TextureColor: vec4<f32> = textureSample(TextureArray, TextureSampler, Input.TextureCoordinate, Material.TextureIndex);

    // Combine material color and texture color
    var Color: vec4<f32> = Input.Color;// * TextureColor;
    return Color;
}