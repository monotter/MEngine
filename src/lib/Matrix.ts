import { Vector3 } from './Transformations'

class Matrix {
	private _data: Float32Array
	private _rows: number
	private _columns: number
	private _determinantCache?: number
	private _inverseCache?: Matrix
	private _adjointCache?: Matrix
	private _transposeCache?: Matrix
	private _roundCache?: Matrix
	private _floorCache?: Matrix
	private _ceilCache?: Matrix
	private _traceCache?: number
	private _stringCache?: string
	private _plainCache?: number[][]
	private _isSquareCache: boolean
	private _isZeroMatrixCache: boolean
	private _positionCache?: Vector3

	constructor(data: Float32Array, columns: number)
	constructor(data: number[][])
	constructor(rows: number, columns: number)
	constructor(arg1: Float32Array | number[][] | number, arg2?: number) {
		if (arg1 instanceof Float32Array) {
			// Case 1: Float32Array
			if (typeof arg2 !== 'number' || arg2 <= 0) {
				throw new Error(
					'For Float32Array, the second argument must be a positive number representing the number of columns.'
				)
			}
			this._rows = arg1.length / arg2
			if (!Number.isInteger(this._rows)) {
				throw new Error('The Float32Array length must be divisible by the number of columns.')
			}
			this._columns = arg2
			this._data = new Float32Array(arg1)
		} else if (Array.isArray(arg1)) {
			// Case 2: 2D Array
			if (!arg1.every((row) => Array.isArray(row) && row.length === arg1[0].length)) {
				throw new Error('All rows in the 2D array must have the same length.')
			}
			this._rows = arg1.length
			this._columns = arg1[0].length
			this._data = new Float32Array(this._rows * this._columns)
			for (let i = 0; i < this._rows; i++) {
				for (let j = 0; j < this._columns; j++) {
					this._data[i * this._columns + j] = arg1[i][j]
				}
			}
		} else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
			// Case 3: Rows and Columns
			if (arg1 <= 0 || arg2 <= 0) {
				throw new Error('Rows and columns must be positive integers.')
			}
			this._rows = arg1
			this._columns = arg2
			this._data = new Float32Array(this._rows * this._columns)
		} else {
			throw new Error('Invalid constructor arguments. Expected Float32Array, 2D array, or rows and columns.')
		}

		// Cache initialization
		this._isSquareCache = this._rows === this._columns
		this._isZeroMatrixCache = this._data.every((value) => value === 0)
	}

	private index(row: number, col: number): number {
		return row * this._columns + col
	}
	private get(row: number, col: number): number {
		return this._data[this.index(row, col)]
	}
	private set(row: number, col: number, value: number): void {
		this._data[this.index(row, col)] = value
	}

	get rows(): number {
		return this._rows
	}
	get columns(): number {
		return this._columns
	}
	get plain(): number[][] {
		if (this._plainCache) return this._plainCache
		const result: number[][] = []
		for (let i = 0; i < this._rows; i++) {
			result[i] = []
			for (let j = 0; j < this._columns; j++) {
				result[i][j] = this.get(i, j)
			}
		}
		this._plainCache = result
		return result
	}
	get buffer(): ArrayBufferLike {
		return this._data.buffer
	}
	get transpose(): Matrix {
		if (this._transposeCache) return this._transposeCache
		const result = new Matrix(this._columns, this._rows)
		for (let i = 0; i < this._rows; i++) {
			for (let j = 0; j < this._columns; j++) {
				result.set(j, i, this.get(i, j))
			}
		}
		this._transposeCache = result
		return result
	}
	get round(): Matrix {
		if (this._roundCache) return this._roundCache
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = Math.round(this._data[i])
		}
		this._roundCache = result
		return result
	}
	get floor(): Matrix {
		if (this._floorCache) return this._floorCache
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = Math.floor(this._data[i])
		}
		this._floorCache = result
		return result
	}
	get ceil(): Matrix {
		if (this._ceilCache) return this._ceilCache
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = Math.ceil(this._data[i])
		}
		return result
	}
	get determinant(): number {
		if (this._determinantCache !== undefined) return this._determinantCache
		if (!this.isSquare) {
			throw new Error('Determinant is only defined for square matrices.')
		}
		const n = this._rows
		let det = 0
		if (n === 1) {
			det = this.get(0, 0)
		} else if (n === 2) {
			det = this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0)
		} else {
			for (let col = 0; col < n; col++) {
				const subMatrix = this.plain.slice(1).map((row) => row.filter((_, idx) => idx !== col))
				const minor = new Matrix(subMatrix).determinant
				const cofactor = (col % 2 === 0 ? 1 : -1) * this.get(0, col) * minor
				det += cofactor
			}
		}
		this._determinantCache = det
		return det
	}
	get adjoint(): Matrix {
		if (this._adjointCache) return this._adjointCache
		if (!this.isSquare) {
			throw new Error('Adjoint is only defined for square matrices.')
		}
		const n = this._rows
		const result: number[][] = []
		for (let i = 0; i < n; i++) {
			result[i] = []
			for (let j = 0; j < n; j++) {
				const subMatrix = this.plain
					.filter((_, row) => row !== i)
					.map((row) => row.filter((_, col) => col !== j))
				const minor = new Matrix(subMatrix).determinant
				result[i][j] = ((i + j) % 2 === 0 ? 1 : -1) * minor
			}
		}
		const adj = result[0].map((_, i) => result.map((row) => row[i])) // Transpose
		this._adjointCache = new Matrix(adj)
		return this._adjointCache
	}
	get inverse(): Matrix {
		if (this._inverseCache) return this._inverseCache
		const det = this.determinant
		if (det === 0) {
			throw new Error('Matrix is singular and cannot be inverted.')
		}
		const adj = this.adjoint
		this._inverseCache = adj.multiply(1 / det)
		return this._inverseCache
	}
	get trace(): number {
		if (this._traceCache !== undefined) return this._traceCache
		if (!this.isSquare) {
			throw new Error('Trace is only defined for square matrices.')
		}
		let sum = 0
		for (let i = 0; i < this._rows; i++) {
			sum += this.get(i, i)
		}
		this._traceCache = sum
		return sum
	}
	get isSquare(): boolean {
		if (this._isSquareCache !== undefined) return this._isSquareCache
		this._isSquareCache = this._rows === this._columns
		return this._isSquareCache
	}
	get isZeroMatrix(): boolean {
		if (this._isZeroMatrixCache !== undefined) return this._isZeroMatrixCache
		this._isZeroMatrixCache = this._data.every((value) => value === 0)
		return this._isZeroMatrixCache
	}
	private get string(): string {
		if (this._stringCache) return this._stringCache
		this._stringCache = this.plain.map((row) => row.join('\t')).join('\n')
		return this._stringCache
	}
	toString(): string {
		return this.string
	}
	equals(other: Matrix, tolerance = 1e-10): boolean {
		if (this._rows !== other.rows || this._columns !== other.columns) return false
		for (let i = 0; i < this._data.length; i++) {
			if (Math.abs(this._data[i] - other._data[i]) > tolerance) return false
		}
		return true
	}
	map(fn: (value: number, row: number, col: number) => number): Matrix {
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._rows; i++) {
			for (let j = 0; j < this._columns; j++) {
				result.set(i, j, fn(this.get(i, j), i, j))
			}
		}
		return result
	}
	fill(value: number): Matrix {
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = value
		}
		return result
	}
	add(v: Matrix): Matrix {
		if (this._rows !== v.rows || this._columns !== v.columns) {
			throw new Error('Matrix dimensions must match for addition.')
		}
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = this._data[i] + v._data[i]
		}
		return result
	}
	subtract(v: Matrix): Matrix {
		if (this._rows !== v.rows || this._columns !== v.columns) {
			throw new Error('Matrix dimensions must match for subtraction.')
		}
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = this._data[i] - v._data[i]
		}
		return result
	}
	multiply(v: Matrix | number): Matrix {
		if (typeof v === 'number') {
			const result = new Matrix(this._rows, this._columns)
			for (let i = 0; i < this._data.length; i++) {
				result._data[i] = this._data[i] * v
			}
			return result
		} else if (v instanceof Matrix) {
			if (this._columns !== v.rows) {
				throw new Error(
					`Matrix dimensions do not match for multiplication: ${this._rows}x${this._columns} vs ${v.rows}x${v.columns}.`
				)
			}
			const result = new Matrix(this._rows, v.columns)
			for (let index = 0; index < this._rows * v.columns; index++) {
				const i = Math.floor(index / v.columns)
				const j = index % v.columns
				let sum = 0
				for (let k = 0; k < this._columns; k++) {
					sum += this.get(i, k) * v.get(k, j)
				}
				result.set(i, j, sum)
			}
			return result
		}
		throw new Error('Invalid argument type for multiplication.')
	}
	hadamard(v: Matrix): Matrix {
		if (this._rows !== v.rows || this._columns !== v.columns) {
			throw new Error('Hadamard product requires matrices of the same size.')
		}
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = this._data[i] * v._data[i]
		}
		return result
	}
	clone(): Matrix {
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = this._data[i]
		}
		return result
	}
	interpolate(v: Matrix, t: number): Matrix {
		if (this._rows !== v.rows || this._columns !== v.columns) {
			throw new Error('Matrix dimensions must match for interpolation.')
		}
		const result = new Matrix(this._rows, this._columns)
		for (let i = 0; i < this._data.length; i++) {
			result._data[i] = this._data[i] + t * (v._data[i] - this._data[i])
		}
		return result
	}
	translate(translation: Vector3): Matrix {
		if (this._rows !== 4 || this._columns !== 4) {
			throw new Error('Translate is only defined for 4x4 matrices.')
		}
		const translationMatrix = new Matrix([
			[1, 0, 0, translation.x],
			[0, 1, 0, translation.y],
			[0, 0, 1, translation.z],
			[0, 0, 0, 1],
		])
		return this.multiply(translationMatrix)
	}
	rotate(angle: number, axis: Vector3): Matrix {
		if (this._rows !== 4 || this._columns !== 4) {
			throw new Error('Rotate is only defined for 4x4 matrices.')
		}
		const unitAxis = axis.unit // Ekseni normalleştir
		const x = unitAxis.x
		const y = unitAxis.y
		const z = unitAxis.z
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const oneMinusCos = 1 - cos
		const rotationMatrix = new Matrix([
			[cos + x * x * oneMinusCos, x * y * oneMinusCos - z * sin, x * z * oneMinusCos + y * sin, 0],
			[y * x * oneMinusCos + z * sin, cos + y * y * oneMinusCos, y * z * oneMinusCos - x * sin, 0],
			[z * x * oneMinusCos - y * sin, z * y * oneMinusCos + x * sin, cos + z * z * oneMinusCos, 0],
			[0, 0, 0, 1],
		])
		return this.multiply(rotationMatrix)
	}
	static identity(n: number): Matrix {
		const result = new Matrix(n, n)
		for (let i = 0; i < n; i++) {
			result.set(i, i, 1)
		}
		return result
	}
	static random(rows: number, cols: number, min = 0, max = 1): Matrix {
		const result = new Matrix(rows, cols)
		for (let i = 0; i < rows * cols; i++) {
			result._data[i] = Math.random() * (max - min) + min
		}
		return result
	}
	static lookAt(eye: Vector3, target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): Matrix {
		const zAxis = eye.sub(target).unit // Forward direction (-Z)
		const xAxis = up.cross(zAxis).unit // Right direction
		const yAxis = zAxis.cross(xAxis).unit // Up direction

		const lookAtMatrix = new Matrix([
			[xAxis.x, yAxis.x, zAxis.x, 0],
			[xAxis.y, yAxis.y, zAxis.y, 0],
			[xAxis.z, yAxis.z, zAxis.z, 0],
			[-xAxis.dot(eye), -yAxis.dot(eye), -zAxis.dot(eye), 1],
		])
		return lookAtMatrix
	}
	lookTo(target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): Matrix {
		const position = new Vector3(this.get(0, 3), this.get(1, 3), this.get(2, 3))
		const direction = target.sub(position).unit
		const zAxis = direction.negate() // Negatif ileri yön
		const xAxis = up.cross(zAxis).unit // Sağ yön
		const yAxis = zAxis.cross(xAxis).unit // Yukarı yön

		return new Matrix([
			[xAxis.x, yAxis.x, zAxis.x, position.x],
			[xAxis.y, yAxis.y, zAxis.y, position.y],
			[xAxis.z, yAxis.z, zAxis.z, position.z],
			[0, 0, 0, 1],
		])
	}
	static perspective(fov: number, aspect: number, near: number, far: number): Matrix {
		const f = 1.0 / Math.tan(fov / 2)
		const nf = 1 / (near - far)
		const perspectiveMatrix = new Matrix([
			[f / aspect, 0, 0, 0],
			[0, f, 0, 0],
			[0, 0, (far + near) * nf, -1],
			[0, 0, 2 * far * near * nf, 0],
		])
		return perspectiveMatrix
	}
	static fromArray(array: number[][]): Matrix {
		return new Matrix(array)
	}
	static fromBuffer(buffer: ArrayBufferLike, columns: number): Matrix {
		const data = new Float32Array(buffer)
		return new Matrix(data, columns)
	}
	static fromCSV(csv: string, delimiter = ','): Matrix {
		const rows = csv
			.trim()
			.split('\n')
			.map((row) =>
				row.split(delimiter).map((value) => {
					const num = parseFloat(value.trim())
					if (isNaN(num)) {
						throw new Error(`Null number on CSV: "${value}"`)
					}
					return num
				})
			)
		if (!rows.every((row) => row.length === rows[0].length)) {
			throw new Error('All rows in the CSV must have the same number of columns.')
		}
		return new Matrix(rows)
	}
	static fromJSON(json: string): Matrix {
		try {
			const data = JSON.parse(json)
			if (!Array.isArray(data) || !data.every((row) => Array.isArray(row))) {
				throw new Error('Invalid JSON format. Expected a 2D array.')
			}
			if (!data.every((row) => row.length === data[0].length)) {
				throw new Error('All rows in the JSON must have the same number of columns.')
			}
			return new Matrix(data)
		} catch (error) {
			throw new Error('Failed to parse JSON: ' + (error instanceof Error ? error.message : String(error)))
		}
	}
}
