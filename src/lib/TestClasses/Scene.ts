import { Camera } from '$lib/TestClasses/Objects/Camera'
import { CFrame, Vector3 } from '$lib/Transformations'
import { Quad, Triangle } from './Objects'

export class Scene {
	triangle_count = 0
	quad_count = 0
	triangles: Triangle[]
	Quads: Quad[]
	s = 0;
	camera: Camera
	moveDirection = new Vector3()
	moveSpeed = 0.5
	yaw: number = 0
	pitch: number = 0
	object_data: Float32Array = new Float32Array(16 * 1024)
	constructor() {
		this.triangles = []
		this.Quads = []

		this.camera = new Camera()
		this.camera.CFrame = new CFrame(new Vector3(0, 0, 4))
		this.make_objects()
		this.initializeControls()
	}
	make_objects() {
		// Önce üçgenleri yaz
		for (let i = 0; i < 4; i++) {
			const triangle = new Triangle()
			this.triangles.push(triangle)
			triangle.Position = [i * 2, 0, 0]
			triangle.Orientation = [0, 90, 0]
			triangle.model.forEach((v, index) => {
				let currindex = i * 16 + index // Sadece üçgen sayısı kadar offset
				this.object_data[currindex] = v
			})
			this.triangle_count++
		}
		// Sonra quad'ları üçgenlerin bittiği yerden başlat
		for (let i = 0; i < 2; i++) {
			const quad = new Quad()
			this.Quads.push(quad)
			quad.Orientation = [90, 0, 0]
			quad.Position = [i * 2, -1, 5]
			quad.Size = [1, 1, 1]
			quad.model.forEach((v, index) => {
				let currindex = (this.triangle_count + i) * 16 + index // üçgenlerin sonundan başla
				this.object_data[currindex] = v
			})
			this.quad_count++
		}
	}
	update() {
		this.camera.CFrame = new CFrame(
			this.camera.CFrame.Position.add(this.moveDirection.multiply(this.moveSpeed))
		).multiply(CFrame.fromEulerAnglesYXZ(this.pitch, this.yaw, 0))

		this.triangles.forEach((triangle, index) => {
			triangle.Orientation = [0,0,0]
			const object_data = triangle.model
			for (let j = 0; j < 16; j++) this.object_data[index * 16 + j] = object_data[j]
		})
		this.Quads.forEach((quad, index) => {
			const object_data = quad.model
			for (let j = 0; j < 16; j++) this.object_data[(this.triangles.length + index) * 16 + j] = object_data[j]
		})
		this.s += 1;
	}
	initializeControls() {
		document.addEventListener('mousemove', (e) => {
			if (document.pointerLockElement) {
				this.yaw -= (e.movementX * 0.1 * Math.PI) / 180

				this.pitch -= (e.movementY * 0.1 * Math.PI) / 180
				this.pitch = Math.max((-90 * Math.PI) / 180, Math.min((90 * Math.PI) / 180, this.pitch))
			}
		})
		document.addEventListener('wheel', (e) => {
			if (document.pointerLockElement) {
				this.moveSpeed -= e.deltaY * 0.001
				this.moveSpeed = Math.max(0.01, Math.min(10, this.moveSpeed))
			}
		})
		let w = false
		let a = false
		let s = false
		let d = false
		let q = false
		let e = false
		let updateMoveDirection = () => {
			this.moveDirection = new Vector3()
			if (w) this.moveDirection = this.moveDirection.add(this.camera.CFrame.LookVector)
			if (s) this.moveDirection = this.moveDirection.add(this.camera.CFrame.LookVector.multiply(-1))
			if (a) this.moveDirection = this.moveDirection.add(this.camera.CFrame.RightVector.multiply(-1))
			if (d) this.moveDirection = this.moveDirection.add(this.camera.CFrame.RightVector)
			if (q) this.moveDirection = this.moveDirection.add(this.camera.CFrame.UpVector.multiply(-1))
			if (e) this.moveDirection = this.moveDirection.add(this.camera.CFrame.UpVector)
			this.moveDirection = this.moveDirection.Unit
		}
		document.addEventListener('keydown', (_e) => {
			if (document.pointerLockElement) {
				switch (_e.key) {
					case 'w':
						w = true
						break
					case 's':
						s = true
						break
					case 'a':
						a = true
						break
					case 'd':
						d = true
						break
					case 'q':
						q = true
						break
					case 'e':
						e = true
						break
				}
			}
			updateMoveDirection()
		})
		document.addEventListener('keyup', (_e) => {
			if (document.pointerLockElement) {
				switch (_e.key) {
					case 'w':
						w = false
						break
					case 's':
						s = false
						break
					case 'a':
						a = false
						break
					case 'd':
						d = false
					case 'q':
						q = false
					case 'e':
						e = false
						break
				}
			}
			updateMoveDirection()
		})
		document.onpointerlockchange = () => {
			if (document.pointerLockElement) {
				document.body.style.overflow = 'hidden'
			} else {
				document.body.style.overflow = ''
			}
		}
		document.onclick = (e) => {
			if (e.button === 0) {
				document.body.requestPointerLock()
			} else if (e.button === 2) {
				document.exitPointerLock()
			}
		}
	}
}
