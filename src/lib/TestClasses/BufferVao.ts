export class BufferArrayObject {
    private _vao: WebGLVertexArrayObject
    private _positionAttribLocation: number
    private _colorAttribLocation: number
    constructor(
        gl: WebGL2RenderingContext,
        positionBuffer: WebGLBuffer,
        colorBuffer: WebGLBuffer,
        positionAttribLocation: number,
        colorAttribLocation: number
    )
    constructor(
        gl: WebGL2RenderingContext,
        interleavedBuffer: WebGLBuffer,
        positionAttribLocation: number,
        colorAttribLocation: number
    )
    constructor(
        gl: WebGL2RenderingContext,
        arg1: any,
        arg2: any,
        arg3: any,
        arg4?: any,
    ) {
        let interleavedBuffer
        let positionBuffer
        let colorBuffer
        let positionAttribLocation
        let colorAttribLocation
        if (arg4 !== undefined && arg4 !== null && typeof arg4 === 'number') {
            positionBuffer = arg1
            colorBuffer = arg2
            positionAttribLocation = arg3
            colorAttribLocation = arg4
        } else {
            interleavedBuffer = arg1
            positionAttribLocation = arg2
            colorAttribLocation = arg3
        }
        this._positionAttribLocation = positionAttribLocation
        this._colorAttribLocation = colorAttribLocation

        const vao = gl.createVertexArray();
        if (!vao) throw new Error('Failed to allocate VAO for two buffers');
        
        this._vao = vao
        gl.bindVertexArray(vao);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(colorAttribLocation);

        if (interleavedBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuffer);
            gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
            gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(null);
    }
    get ArrayObject() {
        return this._vao
    }
    get positionAttribLocation() {
        return this._positionAttribLocation;
    }
    get colorAttribLocation() {
        return this._colorAttribLocation;
    }
}