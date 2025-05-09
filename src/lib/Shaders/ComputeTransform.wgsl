@group(0) @binding(0) var<storage, read> ProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<storage, read> ViewTransformMatrix: mat4x4<f32>;
@group(0) @binding(2) var<storage, read> ModeTransformMatrixArray: array<mat4x4<f32>>;

@group(1) @binding(0) var<storage, read_write> ModelViewProjectArray: array<mat4x4<f32>>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let ModelTransformMatrix = ModeTransformMatrixArray[global_id.x];

    ModelViewProjectArray[global_id.x] = ProjectionMatrix * ViewTransformMatrix * ModelTransformMatrix; // Tam hesaplamayı geri yükle

    // Hata ayıklama için: ModelViewProjectArray'ı yalnızca ModelTransformMatrix olarak ayarlayın - YORUM SATIRI YAPILDI
    // ModelViewProjectArray[global_id.x] = ModelTransformMatrix;
}