import { Vector3 } from '$lib/Transformations/Vector3'
import * as Enums from '$lib/Enums'

export class CFrame {
	#rotation: [number, number, number, number, number, number, number, number, number]
	#location: [number, number, number]
	#positionCache?: Vector3
	#rotationCache?: CFrame
	#lookVectorCache?: Vector3
	#rightVectorCache?: Vector3
	#upVectorCache?: Vector3
	#stringCache?: string
	#inverseCache?: CFrame
	#orthonormalizeCache?: CFrame
	#componentsCache?: [number, number, number, number, number, number, number, number, number, number, number, number]
	#eulerAnglesCache: Map<Enums.RotationOrder, [number, number, number]> = new Map()

	#axisAngleCache?: [Vector3, number]
	constructor()
	constructor(pos: Vector3Like)
	constructor(pos: Vector3Like, lookAt: Vector3Like)
	constructor(x: number, y: number, z: number)
	constructor(x: number, y: number, z: number, qX: number, qY: number, qZ: number, qW: number)
	constructor(
		x: number,
		y: number,
		z: number,
		R00: number,
		R01: number,
		R02: number,
		R10: number,
		R11: number,
		R12: number,
		R20: number,
		R21: number,
		R22: number
	)
	constructor(...args: any[]) {
		if (args.length === 0) {
			this.#location = [0, 0, 0]
			this.#rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1]
		} else if (args.length === 1) {
			const pos = Vector3.asVector3(args[0])
			if (!pos) throw new Error('Argument must be an instance of Vector3')
			this.#positionCache = pos
			this.#location = [pos.X, pos.Y, pos.Z]
			this.#rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1]
		} else if (args.length === 2) {
			const [Position, LookAt] = [args[0], args[1]].map((arg) => {
				const pos = Vector3.asVector3(arg)
				if (!pos) throw new Error('Argument must be an instance of Vector3')
				return pos
			})
			const Forward = LookAt.subtract(Position).Unit
			let ReferenceUp = Vector3.yAxis
			if (Forward.Dot(ReferenceUp) > 0.999) {
				ReferenceUp = Vector3.zAxis
			}
			const Right = Forward.Cross(ReferenceUp).Unit
			const Up = Right.Cross(Forward).Unit

			this.#positionCache = Position
			this.#location = [Position.X, Position.Y, Position.Z]
			this.#rotation = [Right.X, Up.X, -Forward.X, Right.Y, Up.Y, -Forward.Y, Right.Z, Up.Z, -Forward.Z]
		} else if (
			args.length === 3 &&
			typeof args[0] === 'number' &&
			typeof args[1] === 'number' &&
			typeof args[2] === 'number'
		) {
			const x = args[0]
			const y = args[1]
			const z = args[2]
			this.#location = [x, y, z]
			this.#rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1]
		} else if (
			args.length === 7 &&
			typeof args[0] === 'number' &&
			typeof args[1] === 'number' &&
			typeof args[2] === 'number' &&
			typeof args[3] === 'number' &&
			typeof args[4] === 'number' &&
			typeof args[5] === 'number' &&
			typeof args[6] === 'number'
		) {
			const [X, Y, Z, qX, qY, qZ, qW] = args
			this.#location = [X, Y, Z]

			const QuaternionMagnitude = Math.sqrt(qX * qX + qY * qY + qZ * qZ + qW * qW)
			if (QuaternionMagnitude === 0) {
				this.#rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1]
			} else {
				const QuaternionScaler = 1 / QuaternionMagnitude
				const uQX = qX * QuaternionScaler
				const uQY = qY * QuaternionScaler
				const uQZ = qZ * QuaternionScaler
				const uQW = qW * QuaternionScaler

				const x2 = uQX * uQX
				const y2 = uQY * uQY
				const z2 = uQZ * uQZ
				const wx = uQW * uQX
				const wy = uQW * uQY
				const wz = uQW * uQZ
				const xy = uQX * uQY
				const xz = uQX * uQY
				const yz = uQX * uQY

				const R00 = 1 - 2 * y2 - 2 * z2
				const R01 = 2 * xy - 2 * wz
				const R02 = 2 * xz + 2 * wy
				const R10 = 2 * wy + 2 * wz
				const R11 = 1 - 2 * x2 - 2 * z2
				const R12 = 2 * yz - 2 * wx
				const R20 = 2 * xz - 2 * wy
				const R21 = 2 * yz + 2 * wx
				const R22 = 1 - 2 * x2 - 2 * y2

				this.#rotation = [R00, R10, R20, R01, R11, R21, R02, R12, R22]
			}
		} else if (
			args.length === 12 &&
			typeof args[0] === 'number' &&
			typeof args[1] === 'number' &&
			typeof args[2] === 'number' &&
			typeof args[3] === 'number' &&
			typeof args[4] === 'number' &&
			typeof args[5] === 'number' &&
			typeof args[6] === 'number' &&
			typeof args[7] === 'number' &&
			typeof args[8] === 'number' &&
			typeof args[9] === 'number' &&
			typeof args[10] === 'number' &&
			typeof args[11] === 'number'
		) {
			const [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22] = args
			this.#location = [X, Y, Z]
			this.#rotation = [R00, R10, R20, R01, R11, R21, R02, R12, R22]
		} else {
			throw new Error('Invalid arguments for CFrame constructor.')
		}
	}
	static lookAt(at: Vector3Like, lookAt: Vector3Like, up: Vector3Like) {
		const Position = Vector3.asVector3(at)
		if (!Position) throw new Error('Argument must be an instance of Vector3')
		const ToV3 = Vector3.asVector3(lookAt)
		if (!ToV3) throw new Error('Argument must be an instance of Vector3')
		const UpV3 = Vector3.asVector3(up)
		if (!UpV3) throw new Error('Argument must be an instance of Vector3')
		const Forward = ToV3.subtract(Position).Unit
		let ReferenceUp = UpV3
		if (Forward.Dot(ReferenceUp) > 0.999) {
			ReferenceUp = Vector3.yAxis
			if (Forward.Dot(ReferenceUp) > 0.999) {
				ReferenceUp = Vector3.zAxis
			}
		}
		const Right = Forward.Cross(ReferenceUp).Unit
		const Up = Right.Cross(Forward).Unit

		const R00 = Right.X
		const R01 = Right.Y
		const R02 = Right.Z
		const R10 = Up.X
		const R11 = Up.Y
		const R12 = Up.Z
		const R20 = -Forward.X
		const R21 = -Forward.Y
		const R22 = -Forward.Z

		const [X, Y, Z] = Position.toArray()
		return new CFrame(X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22)
	}
	static lookAlong(at: Vector3Like, direction: Vector3Like, up: Vector3Like) {
		const Position = Vector3.asVector3(at)
		if (!Position) throw new Error('Argument must be an instance of Vector3')
		const Direction = Vector3.asVector3(direction)
		if (!Direction) throw new Error('Argument must be an instance of Vector3')
		return CFrame.lookAt(at, Position.add(Direction), up)
	}
	static fromRotationBetweenVectors(from: Vector3Like, to: Vector3Like) {
		const From = Vector3.asVector3(from)
		if (!From) throw new Error('Argument must be an instance of Vector3')
		const To = Vector3.asVector3(to)
		if (!To) throw new Error('Argument must be an instance of Vector3')
		const A = From.Unit
		const B = To.Unit
		const cosθ = A.Dot(B)
		let R = [1, 0, 0, 0, 1, 0, 0, 0, 1]
		if (cosθ > 0.999) {
			// R
		} else if (cosθ < -0.999) {
			let V = new Vector3(-A.Y, A.X, 0)
			if (V.Magnitude < 0.001) {
				V = new Vector3(0, -A.Z, A.Y)
			}
			V = V.Unit
			const vvT = [
				V.X * V.X,
				V.X * V.Y,
				V.X * V.Z,
				V.Y * V.X,
				V.Y * V.Y,
				V.Y * V.Z,
				V.Z * V.X,
				V.Z * V.Y,
				V.Z * V.Z,
			]
			const NI = [-1, 0, 0, 0, -1, 0, 0, 0, -1]
			const twoVvT = [
				2 * vvT[0],
				2 * vvT[1],
				2 * vvT[2],
				2 * vvT[3],
				2 * vvT[4],
				2 * vvT[5],
				2 * vvT[6],
				2 * vvT[7],
				2 * vvT[8],
			]
			for (let i = 0; i < 9; i++) {
				R[i] = NI[i] + twoVvT[i]
			}
		} else {
			const θ = Math.acos(Math.max(-1, Math.min(1, cosθ)))
			const V = A.Cross(B).Unit
			const sinθ = Math.sin(θ)
			const Ncosθ = 1 - cosθ
			const R00 = cosθ + V.X * V.X * Ncosθ
			const R10 = V.X * V.Y * Ncosθ + V.Z * sinθ
			const R20 = V.X * V.Z * Ncosθ - V.Y * sinθ
			const R01 = V.X * V.Y * Ncosθ - V.Z * sinθ
			const R11 = cosθ + V.Y * V.Y * Ncosθ
			const R21 = V.Y * V.Z * Ncosθ + V.X * sinθ
			const R02 = V.X * V.Z * Ncosθ + V.Y * sinθ
			const R12 = V.Y * V.Z * Ncosθ - V.X * sinθ
			const R22 = cosθ + V.Z * V.Z * Ncosθ
			R = [R00, R10, R20, R01, R11, R21, R02, R12, R22]
		}
		const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = R
		return new CFrame(0, 0, 0, R00, R01, R02, R10, R11, R12, R20, R21, R22)
	}
	static fromEulerAngles(
		rx: number,
		ry: number,
		rz: number,
		order: Enums.RotationOrder = Enums.RotationOrder.XYZ
	): CFrame {
		if (typeof rx !== 'number') throw new Error('Argument must be a number')
		if (typeof ry !== 'number') throw new Error('Argument must be a number')
		if (typeof rz !== 'number') throw new Error('Argument must be a number')
		if (!(order in Enums.RotationOrder)) throw new Error('Argument must be a valid RotationOrder enum value')
		const cosX = Math.cos(rx)
		const sinX = Math.sin(rx)
		const cosY = Math.cos(ry)
		const sinY = Math.sin(ry)
		const cosZ = Math.cos(rz)
		const sinZ = Math.sin(rz)

		const Rx = [1, 0, 0, 0, cosX, sinX, 0, -sinX, cosX]
		const Ry = [cosY, 0, -sinY, 0, 1, 0, sinY, 0, cosY]
		const Rz = [cosZ, sinZ, 0, -sinZ, cosZ, 0, 0, 0, 1]
		let Rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1] as [
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number
		]
		switch (order) {
			case Enums.RotationOrder.XYZ: {
				Rotation = this.#multiplyMat3(Rotation, Rx)
				Rotation = this.#multiplyMat3(Rotation, Ry)
				Rotation = this.#multiplyMat3(Rotation, Rz)
				break
			}
			case Enums.RotationOrder.XZY: {
				Rotation = this.#multiplyMat3(Rotation, Rx)
				Rotation = this.#multiplyMat3(Rotation, Rz)
				Rotation = this.#multiplyMat3(Rotation, Ry)
				break
			}
			case Enums.RotationOrder.YXZ: {
				Rotation = this.#multiplyMat3(Rotation, Ry)
				Rotation = this.#multiplyMat3(Rotation, Rx)
				Rotation = this.#multiplyMat3(Rotation, Rz)
				break
			}
			case Enums.RotationOrder.YZX: {
				Rotation = this.#multiplyMat3(Rotation, Ry)
				Rotation = this.#multiplyMat3(Rotation, Rz)
				Rotation = this.#multiplyMat3(Rotation, Rx)
				break
			}
			case Enums.RotationOrder.ZXY: {
				Rotation = this.#multiplyMat3(Rotation, Rz)
				Rotation = this.#multiplyMat3(Rotation, Rx)
				Rotation = this.#multiplyMat3(Rotation, Ry)
				break
			}
			case Enums.RotationOrder.ZYX: {
				Rotation = this.#multiplyMat3(Rotation, Rz)
				Rotation = this.#multiplyMat3(Rotation, Ry)
				Rotation = this.#multiplyMat3(Rotation, Rx)
				break
			}
		}
		return new CFrame(0, 0, 0, ...Rotation)
	}
	static fromEulerAnglesXYZ(rx: number, ry: number, rz: number) {
		if (typeof rx !== 'number') throw new Error('Argument must be a number')
		if (typeof ry !== 'number') throw new Error('Argument must be a number')
		if (typeof rz !== 'number') throw new Error('Argument must be a number')
		return CFrame.fromEulerAngles(rx, ry, rz, Enums.RotationOrder.XYZ)
	}
	static fromEulerAnglesYXZ(rx: number, ry: number, rz: number) {
		if (typeof rx !== 'number') throw new Error('Argument must be a number')
		if (typeof ry !== 'number') throw new Error('Argument must be a number')
		if (typeof rz !== 'number') throw new Error('Argument must be a number')
		return CFrame.fromEulerAngles(rx, ry, rz, Enums.RotationOrder.YXZ)
	}
	static Angles(rx: number, ry: number, rz: number) {
		if (typeof rx !== 'number') throw new Error('Argument must be a number')
		if (typeof ry !== 'number') throw new Error('Argument must be a number')
		if (typeof rz !== 'number') throw new Error('Argument must be a number')
		return CFrame.fromEulerAnglesXYZ(rx, ry, rz)
	}
	static fromOrientation(rx: number, ry: number, rz: number) {
		if (typeof rx !== 'number') throw new Error('Argument must be a number')
		if (typeof ry !== 'number') throw new Error('Argument must be a number')
		if (typeof rz !== 'number') throw new Error('Argument must be a number')
		return CFrame.fromEulerAnglesYXZ(rx, ry, rz)
	}
	static fromAxisAngle(v: Vector3Like, r: number) {
		const v3 = Vector3.asVector3(v)
		if (!v3) throw new Error('Argument must be an instance of Vector3')
		if (typeof r !== 'number') throw new Error('Argument must be a number')

		const V = v3.Unit
		const cosθ = Math.cos(r)
		const sinθ = Math.sin(r)
		const Ncosθ = 1 - cosθ

		const R00 = cosθ + V.X * V.X * Ncosθ
		const R10 = V.X * V.Y * Ncosθ + V.Z * sinθ
		const R20 = V.X * V.Z * Ncosθ - V.Y * sinθ
		const R01 = V.X * V.Y * Ncosθ - V.Z * sinθ
		const R11 = cosθ + V.Y * V.Y * Ncosθ
		const R21 = V.Y * V.Z * Ncosθ + V.X * sinθ
		const R02 = V.X * V.Z * Ncosθ + V.Y * sinθ
		const R12 = V.Y * V.Z * Ncosθ - V.X * sinθ
		const R22 = cosθ + V.Z * V.Z * Ncosθ

		return new CFrame(0, 0, 0, R00, R01, R02, R10, R11, R12, R20, R21, R22)
	}
	static fromMatrix(pos: Vector3Like, vX: Vector3Like, vY: Vector3Like, vZ: Vector3Like) {
		const position = Vector3.asVector3(pos)
		if (!position) throw new Error('Argument must be an instance of Vector3')
		const vX3 = Vector3.asVector3(vX)
		if (!vX3) throw new Error('Argument must be an instance of Vector3')
		const vY3 = Vector3.asVector3(vY)
		if (!vY3) throw new Error('Argument must be an instance of Vector3')
		const vZ3 = Vector3.asVector3(vZ)
		if (!vZ3) throw new Error('Argument must be an instance of Vector3')
		return new CFrame(
			position.X,
			position.Y,
			position.Z,
			vX3.X,
			vY3.Y,
			vZ3.Z,
			vX3.X,
			vY3.Y,
			vZ3.Z,
			vX3.X,
			vY3.Y,
			vZ3.Z
		)
	}
	static get identity() {
		return new CFrame()
	}
	get Position() {
		if (!this.#positionCache)
			this.#positionCache = new Vector3(this.#location[0], this.#location[1], this.#location[2])

		return this.#positionCache
	}
	get Rotation(): CFrame {
		//A copy of the CFrame with no translation.
		if (!this.#rotationCache)
			this.#rotationCache = new CFrame(
				0,
				0,
				0,
				this.#rotation[0],
				this.#rotation[1],
				this.#rotation[2],
				this.#rotation[3],
				this.#rotation[4],
				this.#rotation[5],
				this.#rotation[6],
				this.#rotation[7],
				this.#rotation[8]
			)
		return this.#rotationCache
	}
	get X() {
		return this.#location[0]
	}
	get Y() {
		return this.#location[1]
	}
	get Z() {
		return this.#location[2]
	}
	get LookVector() {
		if (!this.#lookVectorCache)
			this.#lookVectorCache = new Vector3(-this.#rotation[2], -this.#rotation[5], -this.#rotation[8])
		return this.#lookVectorCache
	}
	get RightVector() {
		if (!this.#rightVectorCache)
			this.#rightVectorCache = new Vector3(this.#rotation[0], this.#rotation[3], this.#rotation[6])
		return this.#rightVectorCache
	}
	get UpVector() {
		if (!this.#upVectorCache)
			this.#upVectorCache = new Vector3(this.#rotation[1], this.#rotation[4], this.#rotation[7])
		return this.#upVectorCache
	}
	get XVector() {
		return this.RightVector
	}
	get YVector() {
		return this.UpVector
	}
	get ZVector() {
		return this.LookVector.multiply(-1)
	}
	Inverse() {
		if (!this.#inverseCache)
			this.#inverseCache = new CFrame(
				-this.#location[0],
				-this.#location[1],
				-this.#location[2],
				this.#rotation[0],
				this.#rotation[3],
				this.#rotation[6],
				this.#rotation[1],
				this.#rotation[4],
				this.#rotation[7],
				this.#rotation[2],
				this.#rotation[5],
				this.#rotation[8]
			)
		return this.#inverseCache
	}
	Lerp(goal: CFrame, alpha: number) {
		if (!(goal instanceof CFrame)) throw new Error('Argument must be an instance of CFrame')

		const loc1 = this.#location
		const loc2 = goal.#location
		const [X, Y, Z] = [
			loc1[0] + (loc2[0] - loc1[0]) * alpha,
			loc1[1] + (loc2[1] - loc1[1]) * alpha,
			loc1[2] + (loc2[2] - loc1[2]) * alpha,
		]

		const q1 = CFrame.#mat3ToQuaternion(this.#rotation)
		const q2 = CFrame.#mat3ToQuaternion(goal.#rotation)

		const qInterpolated = CFrame.#slerpQuaternion(q1, q2, alpha)

		const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = CFrame.#quaternionToMat3(qInterpolated)

		return new CFrame(X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22)
	}
	Orthonormalize() {
		if (!this.#orthonormalizeCache) {
			const RightVector = this.RightVector
			const UpVector = this.UpVector

			const ORightVector = RightVector.Unit
			const OLookVector = ORightVector.Cross(UpVector).Unit
			const OUpVector = OLookVector.Cross(ORightVector).Unit

			this.#rotation = [
				ORightVector.X,
				OUpVector.X,
				-OLookVector.X,
				ORightVector.Y,
				OUpVector.Y,
				-OLookVector.Y,
				ORightVector.Z,
				OUpVector.Z,
				-OLookVector.Z,
			]
		}
		return this.#orthonormalizeCache
	}
	ToWorldSpace(other: CFrame): CFrame
	ToWorldSpace(...others: CFrame[]): CFrame[]
	ToWorldSpace(...others: CFrame[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		const results = []
		for (const other of others) {
			if (!(other instanceof CFrame)) throw new Error('Argument must be an instance of CFrame')

			results.push(this.multiply(other))
		}
		if (results.length === 1) {
			return results[0]
		}
		return results
	}
	ToObjectSpace(other: CFrame): CFrame
	ToObjectSpace(...others: CFrame[]): CFrame[]
	ToObjectSpace(...others: CFrame[]) {
		if (others.length === 0) throw new Error('At least one argument is required')

		const results = []
		for (const other of others) {
			if (!(other instanceof CFrame)) throw new Error('Argument must be an instance of CFrame')

			results.push(this.multiply(other.Inverse()))
		}
		if (results.length === 1) {
			return results[0]
		}
		return results
	}
	PointToWorldSpace(point: Vector3Like): Vector3
	PointToWorldSpace(...points: Vector3Like[]): Vector3[]
	PointToWorldSpace(...points: Vector3Like[]) {
		if (points.length === 0) throw new Error('At least one argument is required')

		const results = []
		for (const point of points) {
			const pointV3 = Vector3.asVector3(point)
			if (!pointV3) throw new Error('Argument must be an instance of Vector3')

			results.push(this.multiply(pointV3))
		}
		if (results.length === 1) {
			return results[0]
		}
		return results
	}
	PointToObjectSpace(point: Vector3Like): Vector3
	PointToObjectSpace(...points: Vector3Like[]): Vector3[]
	PointToObjectSpace(...points: Vector3Like[]) {
		if (points.length === 0) throw new Error('At least one argument is required')

		const results = []
		for (const point of points) {
			const pointV3 = Vector3.asVector3(point)
			if (!pointV3) throw new Error('Argument must be an instance of Vector3')

			results.push(this.multiply(pointV3.multiply(-1)))
		}
		if (results.length === 1) {
			return results[0]
		}
		return results
	}
	VectorToObjectSpace(vector: Vector3Like): Vector3
	VectorToObjectSpace(...vectors: Vector3Like[]): Vector3[]
	VectorToObjectSpace(...vectors: Vector3Like[]) {
		if (vectors.length === 0) throw new Error('At least one argument is required')

		const results = []
		for (const vector of vectors) {
			const vectorV3 = Vector3.asVector3(vector)
			if (!vectorV3) throw new Error('Argument must be an instance of Vector3')

			results.push(this.multiply(vectorV3))
		}
		if (results.length === 1) {
			return results[0]
		}
		return results
	}
	GetComponents(): [number, number, number, number, number, number, number, number, number, number, number, number] {
		if (!this.#componentsCache) {
			const [X, Y, Z] = this.#location // Extract position components
			const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = this.#rotation // Extract rotation matrix components

			this.#componentsCache = [X, Y, Z, R00, R01, R02, R10, R11, R12, R20, R21, R22]
		}
		return this.#componentsCache
	}
	ToEulerAngles(order: Enums.RotationOrder = Enums.RotationOrder.XYZ): [number, number, number] {
		if (!Object.values(Enums.RotationOrder).includes(order)) throw new Error('Invalid rotation order')
		const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = this.#rotation
		let EulerAnglesCache = this.#eulerAnglesCache.get(order)
		if (!EulerAnglesCache) {
			switch (order) {
				case Enums.RotationOrder.XYZ:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R02, R12, R22, R10, R11, R12, R22, R01, R00],
						[1, 1, -1]
					)
					break

				case Enums.RotationOrder.XZY:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R01, R00, R02, R10, R11, R12, R22, R02, R00],
						[-1, -1, -1]
					)
					break

				case Enums.RotationOrder.YZX:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R10, R00, R20, R01, R02, R21, R11, R20, R00],
						[1, 1, -1]
					)
					break

				case Enums.RotationOrder.YXZ:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R21, R01, R11, R12, R02, R20, R22, R01, R11],
						[1, -1, 1]
					)
					break

				case Enums.RotationOrder.ZXY:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R20, R00, R10, R01, R02, R21, R22, R00, R10],
						[-1, 1, 1]
					)
					break

				case Enums.RotationOrder.ZYX:
					EulerAnglesCache = CFrame.#eulerCalculate(
						order,
						[R20, R21, R22, R01, R02, R10, R00, R21, R22],
						[-1, -1, 1]
					)
					break
				default:
					throw new Error('Wrong rotation order')
			}
			this.#eulerAnglesCache.set(order, EulerAnglesCache)
		}
		return EulerAnglesCache
	}
	toEulerAnglesXYZ(): [number, number, number] {
		return this.ToEulerAngles(Enums.RotationOrder.XYZ)
	}
	toEulerAnglesYXZ(): [number, number, number] {
		return this.ToEulerAngles(Enums.RotationOrder.YXZ)
	}
	toOrientation(): [number, number, number] {
		return this.ToEulerAngles(Enums.RotationOrder.YXZ)
	}
	ToAxisAngle(): [Vector3, number] {
		if (!this.#axisAngleCache) {
			// Extract the rotation matrix components
			const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = this.#rotation
			const trace = R00 + R11 + R22
			const cosθ = Math.max(-1, Math.min(1, (trace - 1) / 2))
			const θ = Math.acos(cosθ)
			if (θ < 0.001) {
				this.#axisAngleCache = [new Vector3(1, 0, 0), 0]
			} else if (θ > Math.PI - 0.001) {
				const rPlusI = [R00 + 1, R10, R20, R01, R11 + 1, R21, R02, R12, R22 + 1]
				const Right = new Vector3(rPlusI[0], rPlusI[1], rPlusI[2])
				const Up = new Vector3(rPlusI[3], rPlusI[4], rPlusI[5])
				const Forward = new Vector3(rPlusI[6], rPlusI[7], rPlusI[8])
				let CurrentAxis = Right
				if (Up.Magnitude > Right.Magnitude && Up.Magnitude > Forward.Magnitude) {
					CurrentAxis = Up
				} else if (Forward.Magnitude > Right.Magnitude && Forward.Magnitude > Up.Magnitude) {
					CurrentAxis = Forward
				}
				this.#axisAngleCache = [CurrentAxis.Unit, θ]
			} else {
				const sinθ = Math.sin(θ)
				const sinθ2 = sinθ * 2
				const Axis = new Vector3((R21 - R12) / sinθ2, (R02 - R20) / sinθ2, (R10 - R01) / sinθ2).Unit
				this.#axisAngleCache = [Axis, θ]
			}
		}
		return this.#axisAngleCache
	}
	components(): [number, number, number, number, number, number, number, number, number, number, number, number] {
		return this.#componentsCache || this.GetComponents()
	}
	FuzzyEq(other: CFrame, epsilon: number): boolean {
		if (!(other instanceof CFrame)) throw new Error('Argument must be an instance of CFrame')
		if (typeof epsilon !== 'number') throw new Error('Epsilon must be a number')
		// Compare position components
		const positionEqual =
			Math.abs(this.X - other.X) < epsilon &&
			Math.abs(this.Y - other.Y) < epsilon &&
			Math.abs(this.Z - other.Z) < epsilon

		if (!positionEqual) return false

		// Compare rotation matrix components
		const rotationEqual = this.#rotation.every((value, index) => Math.abs(value - other.#rotation[index]) < epsilon)

		return positionEqual && rotationEqual
	}
	toString() {
		if (!this.#stringCache)
			this.#stringCache = `CFrame(${this.#location[0]}, ${this.#location[1]}, ${this.#location[2]}), (${
				this.#rotation[0]
			}, ${this.#rotation[1]}, ${this.#rotation[2]}, ${this.#rotation[3]})`
		return this.#stringCache
	}

	multiply(other: CFrame): CFrame
	multiply(other: Vector3Like): Vector3
	multiply(other: CFrame | Vector3Like): CFrame | Vector3 {
		const otherasV3 = Vector3.asVector3(other)
		if (other instanceof CFrame) {
			const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = this.#rotation
			const [D00, D10, D20, D01, D11, D21, D02, D12, D22] = CFrame.#multiplyMat3(this.#rotation, other.#rotation)

			const [X, Y, Z] = this.#location
			const [oX, oY, oZ] = other.#location

			const newX = R00 * oX + R01 * oY + R02 * oZ + X
			const newY = R10 * oX + R11 * oY + R12 * oZ + Y
			const newZ = R20 * oX + R21 * oY + R22 * oZ + Z

			return new CFrame(newX, newY, newZ, D00, D01, D02, D10, D11, D12, D20, D21, D22)
		} else if (otherasV3 instanceof Vector3) {
			const [R00, R01, R02, R10, R11, R12, R20, R21, R22] = this.#rotation
			const [x, y, z] = this.#location

			const newX = R00 * otherasV3.X + R01 * otherasV3.Y + R02 * otherasV3.Z + x
			const newY = R10 * otherasV3.X + R11 * otherasV3.Y + R12 * otherasV3.Z + y
			const newZ = R20 * otherasV3.X + R21 * otherasV3.Y + R22 * otherasV3.Z + z

			return new Vector3(newX, newY, newZ)
		} else {
			throw new Error('Argument must be an instance of CFrame or Vector3')
		}
	}

	add(other: Vector3Like): CFrame {
		const V = Vector3.asVector3(other)
		if (!V) throw new Error('Argument must be an instance of Vector3')
		return new CFrame(this.X + V.X, this.Y + V.Y, this.Z + V.Z, ...this.#rotation)
	}

	subtract(other: Vector3Like): CFrame {
		const V = Vector3.asVector3(other)
		if (!V) throw new Error('Argument must be an instance of Vector3')
		return new CFrame(this.X - V.X, this.Y - V.Y, this.Z - V.Z, ...this.#rotation)
	}
	static #eulerCalculate(
		order: Enums.RotationOrder = Enums.RotationOrder.XYZ,
		[R1, R2, R3, R4, R5, R6, R7, R8, R9]: number[],
		[S1, S2, S3]: number[]
	): [number, number, number] {
		let ϕ: number, θ: number, ψ: number
		θ = Math.atan2(R1 * S1, Math.sqrt(R2 * R2 + R3 * R3))
		const cosθ = Math.cos(θ)
		if (Math.abs(cosθ) < 0.001) {
			ψ = 0
			if (R1 > 0.999) {
				ϕ = Math.atan2(R4 * S2, R5)
			} else {
				ϕ = Math.atan2(R4 * S2 - 1, R5)
			}
		} else {
			ϕ = Math.atan2(R6 * S3, R7)
			ψ = Math.atan2(R8 * S1 * -1, R9)
		}
		return [ϕ, θ, ψ]
	}
	static #mat3ToQuaternion(
		matrix: [number, number, number, number, number, number, number, number, number]
	): [number, number, number, number] {
		const [R00, R10, R20, R01, R11, R21, R02, R12, R22] = matrix

		const trace = R00 + R11 + R22
		let q = [0, 0, 0, 0] as [number, number, number, number]

		if (trace > 0) {
			const s = 0.5 / Math.sqrt(trace + 1.0)
			q[0] = (R21 - R12) * s
			q[1] = (R02 - R20) * s
			q[2] = (R10 - R01) * s
			q[3] = 0.25 / s
		} else if (R00 > R11 && R00 > R22) {
			const s = 2.0 * Math.sqrt(1.0 + R00 - R11 - R22)
			q[0] = 0.25 * s
			q[1] = (R01 + R10) / s
			q[2] = (R02 + R20) / s
			q[3] = (R21 - R12) / s
		} else if (R11 > R22) {
			const s = 2.0 * Math.sqrt(1.0 + R11 - R00 - R22)
			q[0] = (R01 + R10) / s
			q[1] = 0.25 * s
			q[2] = (R12 + R21) / s
			q[3] = (R02 - R20) / s
		} else {
			const s = 2.0 * Math.sqrt(1.0 + R22 - R00 - R11)
			q[0] = (R02 + R20) / s
			q[1] = (R12 + R21) / s
			q[2] = 0.25 * s
			q[3] = (R10 - R01) / s
		}

		// Kuaterniyonu normalize et
		const mag = Math.sqrt(q[3] * q[3] + q[0] * q[0] + q[1] * q[1] + q[2] * q[2])
		if (mag > 0) {
			q[3] /= mag
			q[0] /= mag
			q[1] /= mag
			q[2] /= mag
		}

		return q
	}
	static #quaternionToMat3(
		q: [number, number, number, number]
	): [number, number, number, number, number, number, number, number, number] {
		const xx = q[0] * q[0]
		const xy = q[0] * q[1]
		const xz = q[0] * q[2]
		const xw = q[0] * q[3]
		const yy = q[1] * q[1]
		const yz = q[1] * q[2]
		const yw = q[1] * q[3]
		const zz = q[2] * q[2]
		const zw = q[2] * q[3]

		return [
			1 - 2 * (yy + zz),
			2 * (xy + zw),
			2 * (xz - yw),
			2 * (xy - zw),
			1 - 2 * (xx + zz),
			2 * (yz + xw),
			2 * (xz + yw),
			2 * (yz - xw),
			1 - 2 * (xx + yy),
		]
	}
	static #slerpQuaternion(
		[q1x, q1y, q1z, q1w]: [number, number, number, number],
		[q2x, q2y, q2z, q2w]: [number, number, number, number],
		t: number
	): [number, number, number, number] {
		// Nokta çarpımı hesapla
		let cosθ = q1w * q2w + q1x * q2x + q1y * q2y + q1z * q2z

		// En kısa yol için q2'nin negatifini al
		const q2Adjusted = [q2x, q2y, q2z, q2w]
		if (cosθ < 0) {
			cosθ = -cosθ
			q2Adjusted[0] = -q2x
			q2Adjusted[1] = -q2y
			q2Adjusted[2] = -q2z
			q2Adjusted[3] = -q2w
		}

		if (cosθ > 0.9995) {
			const result = [
				(1 - t) * q1x + t * q2Adjusted[0],
				(1 - t) * q1y + t * q2Adjusted[1],
				(1 - t) * q1z + t * q2Adjusted[2],
				(1 - t) * q1w + t * q2Adjusted[3],
			]
			const mag = Math.sqrt(
				result[3] * result[3] + result[0] * result[0] + result[1] * result[1] + result[2] * result[2]
			)
			return [result[0] / mag, result[1] / mag, result[2] / mag, result[3] / mag]
		}

		const θ = Math.acos(cosθ)
		const sinθ = Math.sin(cosθ)

		const scale1 = Math.sin((1 - t) * cosθ) / sinθ
		const scale2 = Math.sin(t * cosθ) / sinθ

		return [
			scale1 * q1x + scale2 * q2Adjusted[0],
			scale1 * q1y + scale2 * q2Adjusted[1],
			scale1 * q1z + scale2 * q2Adjusted[2],
			scale1 * q1w + scale2 * q2Adjusted[3],
		]
	}
	static #multiplyMat3(
		A: number[],
		B: number[]
	): [number, number, number, number, number, number, number, number, number] {
		const [A00, A10, A20, A01, A11, A21, A02, A12, A22] = A

		const [B00, B10, B20, B01, B11, B21, B02, B12, B22] = B

		const C00 = A00 * B00 + A01 * B10 + A02 * B20
		const C01 = A00 * B01 + A01 * B11 + A02 * B21
		const C02 = A00 * B02 + A01 * B12 + A02 * B22
		const C10 = A10 * B00 + A11 * B10 + A12 * B20
		const C11 = A10 * B01 + A11 * B11 + A12 * B21
		const C12 = A10 * B02 + A11 * B12 + A12 * B22
		const C20 = A20 * B00 + A21 * B10 + A22 * B20
		const C21 = A20 * B01 + A21 * B11 + A22 * B21
		const C22 = A20 * B02 + A21 * B12 + A22 * B22

		const C = [C00, C10, C20, C01, C11, C21, C02, C12, C22] as [
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number,
			number
		]
		return C
	}
}