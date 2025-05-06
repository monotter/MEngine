import { CFrame, Vector3 } from '$lib/Transformations'
import { Instance, type InstanceEvents, type InstanceProperties } from '../Instance'

export type Object3DProperties = InstanceProperties | 'CFrame' | 'Position' | 'Orientation'
export type Object3DEvents = InstanceEvents
export class Object3D<
	Properties extends string = Object3DProperties,
	Events extends string = Object3DEvents
> extends Instance<Properties, Events> {
	protected _CFrame?: CFrame
	#PositionCache?: Vector3
	#OrientationCache?: Vector3
	constructor(className: string) {
		super(className)
	}
	get CFrame() {
		if (!this._CFrame) {
			this._CFrame = new CFrame()
		}
		return this._CFrame
	}
	get Position(): Vector3 {
		if (!this.#PositionCache) {
			this.#PositionCache = this.CFrame.Position
		}
		return this.#PositionCache
	}
	get Orientation(): Vector3 {
		if (!this.#OrientationCache) {
			this.#OrientationCache = new Vector3(...this.CFrame.toOrientation().map((v) => v * (180 / Math.PI)))
		}
		return this.#OrientationCache
	}
	set CFrame(CFrame: CFrame) {
		this._CFrame = CFrame
		this.#OrientationCache = undefined
		this.#PositionCache = undefined

		this._Events.Changed.emit('CFrame')
		this._Events.Changed.emit('Position')
		this._Events.Changed.emit('Orientation')
	}
	set Position(Position: Vector3Like) {
		const PositionV = Vector3.asVector3(Position)
		if (!PositionV) throw new Error('Position must be a valid Vector3')
		this.CFrame = this.CFrame.Rotation.add(Position)
	}
	set Orientation(Orientation: Vector3Like) {
		const OrientationV = Vector3.asVector3(Orientation)
		if (!OrientationV) throw new Error('Orientation must be a valid Vector3')
		const [X, Y, Z] = OrientationV.toArray().map((v) => v * (Math.PI / 180))
		this.CFrame = CFrame.fromOrientation(X, Y, Z).add(this.Position)
	}
}
