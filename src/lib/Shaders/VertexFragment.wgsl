struct MaterialStruct {
    Color: vec4<f32>,
    TextureIndex: u32,
    // Padding to match std140/std430 layout if needed, or ensure TextureIndex is last or properly aligned.
    // For simplicity, assuming TextureIndex as u32 is fine if the CPU-side data matches this structure.
};

@group(0) @binding(0) var<storage, read> Materials: array<MaterialStruct>;
@group(0) @binding(1) var TextureArray: texture_2d_array<f32>; // Texture Array
@group(0) @binding(2) var TextureSampler: sampler; // Sampler

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

    let ModelViewProjection: mat4x4<f32> = ModelViewProjectArray[Input.ModelViewProjectIndex];
    Output.Position = ModelViewProjection * vec4<f32>(Input.Position, 1.0);

    Output.TextureCoordinate = Input.UVPosition;
    Output.Normal = Input.Normal;
    // Output.Color = Materials[Input.MaterialIndex].Color; // Color is now primarily from texture
    Output.MaterialIndex = Input.MaterialIndex; // Pass MaterialIndex to fragment shader
    return Output;
}

@fragment
fn fragment_main(Input: VertexOutputStruct) -> @location(0) vec4<f32> {
    let material = Materials[Input.MaterialIndex];
    let textureColor = textureSample(TextureArray, TextureSampler, Input.TextureCoordinate, material.TextureIndex);

    // --- Lighting Calculation using Normals ---
    // Normalize the incoming normal vector (it's interpolated from vertex shader, so may not be unit length)
    let N = Input.Normal;

    // Define a light direction. Since Input.Normal is in model space, this lightDirection is also in model space.
    // This means the light is fixed relative to the object's orientation.
    // Example: a light shining somewhat from the object's local positive Z-axis and positive Y-axis.
    let lightDirection = normalize(vec3<f32>(0.0, 0.5, 1.0));

    // Calculate diffuse lighting intensity (Lambertian reflection)
    // max(dot(N, L), 0.0) ensures intensity is non-negative.
    let diffuseIntensity = max(dot(N, lightDirection), 0.0);

    // Add a simple ambient light component to prevent areas from being completely black.
    let ambientIntensity = 0.15; // Small ambient contribution

    // Combine diffuse and ambient light.
    // totalLightIntensity will range from ambientIntensity (in shadow) to 1.0 (fully lit).
    let totalLightIntensity = ambientIntensity + (1.0 - ambientIntensity) * diffuseIntensity;

    // Modulate the RGB components of the texture color by the calculated light intensity.
    // Alpha component of the texture is preserved.
    let litRgb = textureColor.rgb * totalLightIntensity;
    let litTextureColor = vec4<f32>(litRgb, textureColor.a);
    // --- End of Lighting Calculation ---

    // Combine the lit texture color with the material's base color (e.g., for tinting).
    return material.Color * litTextureColor;
}