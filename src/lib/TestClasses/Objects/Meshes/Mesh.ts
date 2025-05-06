export class Mesh {
	buffer?: GPUBuffer
	bufferLayout?: GPUVertexBufferLayout
	#device?: GPUDevice
	#verticies: Float32Array
	constructor(verticies: Float32Array = new Float32Array(), bufferLayout: GPUVertexBufferLayout) {
		this.#verticies = verticies
		this.bufferLayout = bufferLayout
	}
	setDevice(device: GPUDevice) {
		const descriptor: GPUBufferDescriptor = {
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
			size: this.#verticies.byteLength,
			mappedAtCreation: true,
		}
		this.#device = device
		this.buffer = this.#device.createBuffer(descriptor)
		new Float32Array(this.buffer.getMappedRange()).set(this.#verticies)
		this.buffer.unmap()
	}
}
