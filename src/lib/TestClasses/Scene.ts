import { Camera } from '$lib/TestClasses/Objects/Camera'
import { CFrame, Vector3 } from '$lib/Transformations'
import type { MeshPart } from './Objects/Models/MeshPart';

export class Scene {
	s = 0;
	camera: Camera
	moveDirection = new Vector3()
	moveSpeed = 0.5
	yaw: number = 0
	pitch: number = 0
	VerticiesData: Map<any, Float32Array> = new Map()
	CurrentSlot: Map<any, number> = new Map()
	ObjectSlotMap: Map<any, [number]> = new Map()
	constructor() {
		this.camera = new Camera()
		this.camera.CFrame = new CFrame(new Vector3(0, 0, 4))
		this.make_objects()
		this.initializeControls()
	}
	addObject(object: MeshPart) {
		object.Mesh.VertexCount
		object.Material.texture
	}
	removeObject(object: MeshPart) {
	}
	updateObject(object: MeshPart) {
		
	}
	make_objects() {
		
	}
	update() {
		this.camera.CFrame = new CFrame(
			this.camera.CFrame.Position.add(this.moveDirection.multiply(this.moveSpeed))
		).multiply(CFrame.fromEulerAnglesYXZ(this.pitch, this.yaw, 0))
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
