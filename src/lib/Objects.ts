import { Vector2, Vector3 } from './Transformations'

class Part {
	Verticies: Vector3[] = []
	private _Position: Vector3 = new Vector3(0, 0, 0)
	private _Size: Vector3 = new Vector3(1, 1, 1)
	private _Rotation: Vector3 = new Vector3(1, 1, 1)

	constructor(
		Size: Vector3 = new Vector3(1, 1, 1),
		Position: Vector3 = new Vector3(0, 0, 0),
		Rotation: Vector3 = new Vector3(0, 0, 0)
	) {
		this._Position = Position
		this._Size = Size
		this._Rotation = Rotation
		this.UpdateVerticies()
	}
	private UpdateVerticies() {
		const Verticies = [
			new Vector3(
				this._Position.x - this._Size.x / 2,
				this._Position.y - this._Size.y / 2,
				this._Position.z - this._Size.z / 2
			),
			new Vector3(
				this._Position.x + this._Size.x / 2,
				this._Position.y - this._Size.y / 2,
				this._Position.z - this._Size.z / 2
			),
			new Vector3(
				this._Position.x + this._Size.x / 2,
				this._Position.y + this._Size.y / 2,
				this._Position.z - this._Size.z / 2
			),
			new Vector3(
				this._Position.x - this._Size.x / 2,
				this._Position.y + this._Size.y / 2,
				this._Position.z - this._Size.z / 2
			),
			new Vector3(
				this._Position.x - this._Size.x / 2,
				this._Position.y - this._Size.y / 2,
				this._Position.z + this._Size.z / 2
			),
			new Vector3(
				this._Position.x + this._Size.x / 2,
				this._Position.y - this._Size.y / 2,
				this._Position.z + this._Size.z / 2
			),
			new Vector3(
				this._Position.x + this._Size.x / 2,
				this._Position.y + this._Size.y / 2,
				this._Position.z + this._Size.z / 2
			),
			new Vector3(
				this._Position.x - this._Size.x / 2,
				this._Position.y + this._Size.y / 2,
				this._Position.z + this._Size.z / 2
			),
		]
		const SinX = Math.sin(this._Rotation.x)
		const CosX = Math.cos(this._Rotation.x)
		const SinY = Math.sin(this._Rotation.y)
		const CosY = Math.cos(this._Rotation.y)
		const SinZ = Math.sin(this._Rotation.z)
		const CosZ = Math.cos(this._Rotation.z)

		this.Verticies = Verticies.map((v) => {
			const x = v.x * CosY * CosZ - v.y * CosY * SinZ + v.z * SinY
			const y =
				v.x * (SinX * SinY * CosZ + CosX * SinZ) + v.y * (CosX * CosZ - SinX * SinY * SinZ) - v.z * SinX * CosY
			const z =
				v.x * (SinX * SinZ - CosX * SinY * CosZ) + v.y * (CosX * SinY * SinZ + SinX * CosZ) + v.z * CosX * CosY
			return new Vector3(x, y, z)
		})
	}

	set Position(v: Vector3) {
		this._Position = v
		this.UpdateVerticies()
	}
	set Size(v: Vector3) {
		this._Size = v
		this.UpdateVerticies()
	}
	Rotate(x: Vector2, y: Vector2, z: Vector2) {}
	set Rotatiton(v: Vector3) {
		this._Rotation = v
		this.UpdateVerticies()
	}
}
class Camera {
	private _Position: Vector3 = new Vector3(0, 0, 0)
	private _Rotation: Vector3 = new Vector3(0, 0, 0)
	private _Fov: number = 60
	private _Near: number = 0.1
	private _Far: number = 1000
	constructor(
		Position: Vector3 = new Vector3(0, 0, 0),
		Rotation: Vector3 = new Vector3(0, 0, 0),
		Fov: number = 60,
		Near: number = 0.1,
		Far: number = 1000
	) {
		this._Position = Position
		this._Rotation = Rotation
		this._Fov = Fov
		this._Near = Near
		this._Far = Far
	}
	get Position() {
		return this._Position
	}
	set Position(v: Vector3) {
		this._Position = v
	}
	get Rotation() {
		return this._Rotation
	}
	set Rotation(v: Vector3) {
		this._Rotation = v
	}
	get Fov() {
		return this._Fov
	}
	set Fov(v: number) {
		this._Fov = v
	}
	get Near() {
		return this._Near
	}
	set Near(v: number) {
		this._Near = v
	}
	get Far() {
		return this._Far
	}
	set Far(v: number) {
		this._Far = v
	}
}
export { Part, Camera }
