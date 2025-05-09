type Vector2Like =
	| number[]
	| ({ x?: any; X?: any; y?: any; Y?: any } & { [key: string]: any } & (
				| { x: any }
				| { X: any }
				| { y: any }
				| { Y: any }
			))

type Vector3Like =
	| number[] // Sayı arrayine izin ver
	| ({ x?: any; X?: any; y?: any; Y?: any; z?: any; Z?: any } & {
			[key: string]: any
	  } & ({ x: any } | { X: any } | { y: any } | { Y: any } | { z: any } | { Z: any }))
type mat4 = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
]
type mat3 = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
]
type vec2 = [number, number]
type vec3 = [number, number, number]
type vec4 = [number, number, number, number]
// import type { CFrame } from './Transformations/CFrame'
// import type { Vector3 } from './Transformations/Vector3'
// import type { Vector2 } from './Transformations/Vector2'
type MaterialType = {
    texture: GPUTexture;
    view: GPUTextureView;
    sampler: GPUSampler;
    bindGroup: GPUBindGroup;
    bindGroupLayout: GPUBindGroupLayout;
}
type MeshType = {
	BufferLayout: GPUBufferLayout,
	Buffer: GPUBuffer,
	VertexCount: number,
}