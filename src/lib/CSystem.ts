import { Vector3 } from './Transformations'

class CSystem {
	Position: Vector3
	Rotation: Vector3
	LookVector: Vector3
	UpVector: Vector3
	RightVector: Vector3
	UpdateVectors() {
		// this.LookVector =
		// this.UpVector =
		// this.RightVector =
	}
	constructor(Position: Vector3 = new Vector3(0, 0, 0), Rotation: Vector3 = new Vector3(0, 0, 0)) {
		// x y z, rx, ry, rz

		this.Position = Position
		this.Rotation = Rotation
		this.LookVector = new Vector3(0, 0, 1)
		this.UpVector = new Vector3(0, 1, 0)
		this.RightVector = new Vector3(1, 0, 0)
	}
}
