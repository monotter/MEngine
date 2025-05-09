import shader from '$lib/Shaders/shaders.wgsl?raw'
import { Camera } from '$lib/TestClasses/Objects/Camera'
import { MaterialImporter } from './Importers'

import { createPerspectiveMatrix, toMatrixString } from '$lib/Transformations'

export class Renderer {
	adapter?: GPUAdapter
	device?: GPUDevice
	context?: GPUCanvasContext
	format?: GPUTextureFormat

	uniformBuffer?: GPUBuffer
	pipeline?: GPURenderPipeline
	frameGroupLayout?: GPUBindGroupLayout
	frameBindGroup?: GPUBindGroup

	depthStencilState?: GPUDepthStencilState
	depthStencilAttachment?: GPURenderPassDepthStencilAttachment
	depthStencilBuffer?: GPUTexture
	depthStencilView?: GPUTextureView

	objectBuffer?: GPUBuffer

	triangleMaterial?: { bindGroup: GPUBindGroup, bindGroupLayout: GPUBindGroupLayout }
	quadMaterial?: { bindGroup: GPUBindGroup, bindGroupLayout: GPUBindGroupLayout }

	constructor(public canvas: HTMLCanvasElement) {
		this.canvas.width = this.canvas.offsetWidth
		this.canvas.height = this.canvas.offsetHeight
	}

	async Initialize() {
		await this.setupDevice()

		await this.makeBindGroupLayouts()

		await this.createAssets()

		await this.makeDepthBufferResources()

		await this.makePipeline()

		await this.makeBindGroup()
	}
	async makeBindGroupLayouts() {
		if (!this.device) throw new Error('Device not initialized')
		this.frameGroupLayout = this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: 'read-only-storage',
						hasDynamicOffset: false,
					},
				},
			],
		})
	}
	async setupDevice() {
		this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter()
		this.device = <GPUDevice>await this.adapter.requestDevice()
		this.context = <GPUCanvasContext>this.canvas.getContext('webgpu')
		this.format = 'bgra8unorm'
		this.context.configure({
			device: this.device,
			format: this.format,
			alphaMode: 'opaque',
		})
		Triangle.Mesh.setDevice(this.device)
		Quad.Mesh.setDevice(this.device)
	}
	async makeDepthBufferResources() {
		if (!this.device) throw new Error('Device not initialized')
		this.depthStencilState = {
			format: 'depth24plus-stencil8',
			depthWriteEnabled: true,
			depthCompare: 'less-equal',
		}
		const size: GPUExtent3D = {
			width: this.canvas.width,
			height: this.canvas.height,
			depthOrArrayLayers: 1,
		}
		const depthBufferDescriptor: GPUTextureDescriptor = {
			size: size,
			format: 'depth24plus-stencil8',
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		}
		this.depthStencilBuffer = this.device.createTexture(depthBufferDescriptor)
		const viewDescriptor: GPUTextureViewDescriptor = {
			format: 'depth24plus-stencil8',
			dimension: '2d',
			aspect: 'all',
		}
		this.depthStencilView = this.depthStencilBuffer.createView(viewDescriptor)

		this.depthStencilAttachment = {
			view: this.depthStencilView,
			depthClearValue: 1.0,
			depthLoadOp: 'clear',
			depthStoreOp: 'store',

			stencilLoadOp: 'clear',
			stencilStoreOp: 'discard',
		}
	}
	async makePipeline() {
		if (!this.device) throw new Error('Device not initialized')
		if (!this.format) throw new Error('Format not initialized')
		if (!this.quadMaterial) throw new Error('Material not initialized')
		if (!this.triangleMaterial) throw new Error('Material not initialized')

		this.uniformBuffer = this.device.createBuffer({
			size: 1024,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})



		const pipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [this.frameGroupLayout, this.quadMaterial.bindGroupLayout],
		})

		this.pipeline = this.device.createRenderPipeline({
			vertex: {
				module: this.device.createShaderModule({
					code: shader,
				}),
				entryPoint: 'vs_main',
				buffers: [Triangle.Mesh.bufferLayout],
			},
			fragment: {
				module: this.device.createShaderModule({
					code: shader,
				}),
				entryPoint: 'fs_main',
				targets: [
					{
						format: this.format,
					},
				],
			},
			primitive: {
				topology: 'triangle-list',
			},

			layout: pipelineLayout,
			depthStencil: this.depthStencilState,
		})
	}
	async createAssets() {
		if (!this.device) throw new Error('Device not initialized')
		const modelBufferDescriptor: GPUBufferDescriptor = {
			size: 64 * 1024,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
		}
		this.objectBuffer = this.device.createBuffer(modelBufferDescriptor)
		this.triangleMaterial = await MaterialImporter.import('https://picsum.photos/200/300', this.device)
		this.quadMaterial = await MaterialImporter.import('https://picsum.photos/200/300', this.device)
	}
	async makeBindGroup() {
		if (!this.device) throw new Error('Device not initialized')
		if (!this.frameGroupLayout) throw new Error('FrameGroupLayout not initialized')
		this.frameBindGroup = this.device.createBindGroup({
			layout: this.frameGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer!,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: this.objectBuffer!,
					},
				},
			],
		})
	}
	async render(RenderData) {
		if (!this.device) throw new Error('Device not initialized')
		if (!this.context) throw new Error('Context not initialized')
		if (!this.pipeline) throw new Error('Pipeline not initialized')
		if (!this.uniformBuffer) throw new Error('UniformBuffer not initialized')
		if (!this.objectBuffer) throw new Error('ObjectBuffer not initialized')
		this.canvas.width = this.canvas.offsetWidth
		this.canvas.height = this.canvas.offsetHeight

		const projectionMatrix = createPerspectiveMatrix(
			(60 * Math.PI) / 180,
			this.canvas.offsetWidth / this.canvas.offsetHeight
		)
		this.device.queue.writeBuffer(this.objectBuffer, 0, RenderData.VertexData, 0, RenderData.VertexData.length)
		this.device.queue.writeBuffer(this.uniformBuffer, 0, RenderData.View)
		this.device.queue.writeBuffer(this.uniformBuffer, 64, new Float32Array(projectionMatrix))

		const commandEncoder = this.device.createCommandEncoder()

		const textureView = this.context.getCurrentTexture().createView()

		const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.0, g: 0.5, b: 0.5, a: 1.0 },
					loadOp: 'clear',
					storeOp: 'store',
				},
			],
			depthStencilAttachment: this.depthStencilAttachment,
		})

		renderPass.setPipeline(this.pipeline)
		renderPass.setBindGroup(0, this.frameBindGroup)
		let objects_drawn: number = 0


		renderPass.setVertexBuffer(0, Triangle.Mesh.buffer)
		renderPass.setBindGroup(1, this.triangleMaterial?.bindGroup)
		renderPass.draw(3, RenderData.ModelCounts.get(Triangle), 0, objects_drawn)
		objects_drawn += RenderData.ModelCounts.get(Triangle)!

		renderPass.setVertexBuffer(0, Quad.Mesh.buffer)
		renderPass.setBindGroup(1, this.quadMaterial?.bindGroup)
		renderPass.draw(6, RenderData.ModelCounts.get(Quad), 0, objects_drawn)
		objects_drawn += RenderData.ModelCounts.get(Quad)!

		renderPass.end()

		this.device.queue.submit([commandEncoder.finish()])
	}
}
