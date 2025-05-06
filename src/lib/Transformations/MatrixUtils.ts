import { CFrame } from './CFrame'
import { Vector3 } from './Vector3'

export function createPerspectiveMatrix(fov: number, aspect: number, near: number = 0.01, far: number = 1000): mat4 {
	if (fov < 0.01) {
		throw new Error('FOV must be greater than 0.01 units')
	}
	const f = 1 / Math.tan(fov / 2)
	const nf = 1 / (near - far)
	const b = far != null && far !== Infinity
	return [
		f / aspect,
		0,
		0,
		0,
		0,
		f,
		0,
		0,
		0,
		0,
		b ? (far + near) * nf : -1,
		-1,
		0,
		0,
		b ? 2 * far * near * nf : -2 * near,
		0,
	] as mat4
}

export function createViewMatrix(CFrame: CFrame): mat4 {
	const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = CFrame.GetComponents()

	const dX = -(R00 * X + R01 * Y + R02 * Z)
	const dY = -(R10 * X + R11 * Y + R12 * Z)
	const dZ = -(R20 * X + R21 * Y + R22 * Z)

	const view = [R00, R10, R20, 0, R01, R11, R21, 0, R02, R12, R22, 0, dX, dY, dZ, 1] as mat4

	return view
}

export function createModelMatrix(CFrame: CFrame, Scale: Vector3Like = new Vector3(1, 1, 1)): mat4 {
	if (!CFrame) throw new Error('CFrame must be a valid CFrame')
	const ScaleVector = Vector3.asVector3(Scale)
	if (!ScaleVector) throw new Error('Scale must be a valid Vector3')
	const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = CFrame.GetComponents()
	const [ScaleX, ScaleY, ScaleZ] = ScaleVector.toArray()
	const model = [
		R00 * ScaleX,
		R10 * ScaleY,
		R20 * ScaleZ,
		0,
		R01 * ScaleX,
		R11 * ScaleY,
		R21 * ScaleZ,
		0,
		R02 * ScaleX,
		R12 * ScaleY,
		R22 * ScaleZ,
		0,
		X,
		Y,
		Z,
		1,
	] as mat4

	return model
}

export function toMatrixString(m: mat4) {
	const array = Array(16)
	let i = 0
	while (i++ < 16) array[i - 1] = m[i - 1]
	const chunkSize = 4
	let str = ``
	for (let i = 0; i < array.length; i += chunkSize) {
		str += `${array
			.slice(i, i + chunkSize)
			.map((a) => Math.round(a * 100) / 100)
			.join(', ')}\n`
	}
	return str
}
