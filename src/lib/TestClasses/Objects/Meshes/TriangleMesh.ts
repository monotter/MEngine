import { Mesh } from './Mesh'

export const TriangleMesh = new Mesh(
	new Float32Array([
		+0.0,
		+0.5,
		+0.0,
		+0.5,
		+0.0, // top
		-0.0,
		-0.5,
		-0.5,
		+0.0,
		+1.0, // left bottom
		+0.0,
		-0.5,
		+0.5,
		+1.0,
		+1.0, // right bottom
	]),
	{
		arrayStride: 5 * 4,
		attributes: [
			{
				shaderLocation: 0,
				offset: 0,
				format: 'float32x3',
			},
			{
				shaderLocation: 1,
				offset: 3 * 4,
				format: 'float32x2',
			},
		],
	}
)
