struct MaterialStruct {
    Color: vec4<f32>,
    TextureIndex: u32,
};

@group(0) @binding(0) var<storage, read> Materials: array<MaterialStruct>;
// @group(0) @binding(1) var TextureArray: texture_2d_array<f32>;
// @group(0) @binding(2) var TextureSampler: sampler;

@group(1) @binding(0) var<storage, read> ModelViewProjectArray: array<mat4x4<f32>>;

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

    // Matris dönüşümlerini yeniden etkinleştirin
    let ModelViewProjection: mat4x4<f32> = ModelViewProjectArray[Input.ModelViewProjectIndex];
    Output.Position = ModelViewProjection * vec4<f32>(Input.Position, 1.0);

    Output.TextureCoordinate = Input.UVPosition;
    Output.Normal = Input.Normal;
    Output.Color = Materials[Input.MaterialIndex].Color; // Malzeme rengini geri yükle
    // Output.Color = vec4<f32>(0.0, 1.0, 0.0, 1.0); // Sabit yeşil renk - YORUM SATIRI YAPILDI
    Output.MaterialIndex = Input.MaterialIndex;
    return Output;
}

@fragment
fn fragment_main(Input: VertexOutputStruct) -> @location(0) vec4<f32> {
    // Fetch the texture using the material index
    // let Material = Materials[Input.MaterialIndex]; // Hala yorum satırı
    // let TextureColor: vec4<f32> = textureSample(TextureArray, TextureSampler, Input.TextureCoordinate, Material.TextureIndex);

    // Combine material color and texture color
    var Color: vec4<f32> = Input.Color; // Köşe gölgelendiricisinden gelen rengi kullanın
    // return Input.Color; // Köşe gölgelendiricisinden gelen rengi kullanın - YORUM SATIRI YAPILDI
    return Color;
}