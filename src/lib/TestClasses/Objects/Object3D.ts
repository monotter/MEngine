import { EmitSignal } from '$lib/Signal'
import { CFrame, Vector3 } from '$lib/Transformations'
import { Instance, type InstanceProperties } from '../Instance'

export type Object3DProperties = InstanceProperties | 'CFrame' | 'Position' | 'Orientation'
export class Object3D<Properties = Object3DProperties> extends Instance<Properties> {
	constructor(className: string) {
		super(className)
	}

	// #region Private Properties
	#PositionCache?: Vector3
	#OrientationCache?: Vector3
	// #endregion

	// #region Shared Properties
	protected _CFrame?: CFrame
	// #endregion

	// #region Public Properties
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
		this._Changed && EmitSignal(this._Changed, 'CFrame' as Properties)
		this._Changed && EmitSignal(this._Changed, 'Position' as Properties)
		this._Changed && EmitSignal(this._Changed, 'Orientation' as Properties)
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
	// #endregion

	// #region Shared Methods
	protected _DestroyEvents() {
		super._DestroyEvents()
	}
	// #endregion
}