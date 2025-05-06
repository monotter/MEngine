export class VertexBuffer {
    private _buffer: WebGLBuffer;
    constructor(gl: WebGL2RenderingContext, data: ArrayBuffer) {
        this._buffer = gl.createBuffer();
        if (!this.buffer) {
            throw new Error('Failed to allocate buffer');
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    get buffer() {
        return this._buffer;
    }
}