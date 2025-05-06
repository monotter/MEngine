import rawVertexShader from "$lib/Shaders/test3.vert?raw";
import rawFragmentShader from "$lib/Shaders/test3.frag?raw";

class WebGLProgram {
    #gl: WebGL2RenderingContext
    constructor(gl: WebGL2RenderingContext) {
        this.#gl = gl;
        const program = gl.createProgram();
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

        gl.shaderSource(vertexShader, rawVertexShader);
        gl.shaderSource(fragmentShader, rawFragmentShader);

        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);
        gl.useProgram(program);
    }
    update(gl: WebGL2RenderingContext) {
        
    }
}