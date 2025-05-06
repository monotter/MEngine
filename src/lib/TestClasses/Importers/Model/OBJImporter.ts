export class OBJImporter {
    private static async download(url: string): Promise<Blob> {
        const response: Response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const blob: Blob = await response.blob();
        return blob;
    }
    private static async toLines(blob: Blob): Promise<string[]> {
        const file_contents = (await blob.text())
        const lines = file_contents.split("\n");
        return lines;
    }
    private static applyVertex(Line: string, Verticies: vec3[]) {
        const components = Line.split(" ");

        const new_vertex: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];
        Verticies.push(new_vertex);
    }
    private static applyTextureCoord(Line: string, TextureCoords: vec2[]) {
        const components = Line.split(" ");
        const new_texcoord: vec2 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf()
        ];
        TextureCoords.push(new_texcoord);
    }
    private static applyNormal(Line: string, VertexNormals: vec3[]) {
        const components = Line.split(" ");
        const new_normal: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];
        VertexNormals.push(new_normal);
    }
    private static applyFace({ Line, Result, Verticies, TextureCoords }: { Line: string, Result: number[], Verticies: vec3[], TextureCoords: vec2[] }) {
        Line = Line.replace("\n", "");
        const VertexDescription = Line.split(" ");
        const TriangleCount = VertexDescription.length - 3; // accounting also for "f"
        for (let i = 0; i < TriangleCount; i++) {
            this.applyCorner({ VertexDescription: VertexDescription[1], Result, Verticies, TextureCoords });
            this.applyCorner({ VertexDescription: VertexDescription[2 + i], Result, Verticies, TextureCoords });
            this.applyCorner({ VertexDescription: VertexDescription[3 + i], Result, Verticies, TextureCoords });
        }
    }
    private static applyCorner({Result, TextureCoords, VertexDescription, Verticies}: { VertexDescription: string, Result: number[], Verticies: vec3[], TextureCoords: vec2[] }): number[] {
        const v_vt_vn = VertexDescription.split("/");
        const V = Verticies[Number(v_vt_vn[0]).valueOf() - 1];
        const VT = TextureCoords[Number(v_vt_vn[1]).valueOf() - 1];
        //ignoring normals for now
        Result.push(V[0], V[1], V[2], VT[0], VT[1]);
        return Result;
    }
    public static async import(url: string, device: GPUDevice): Promise<{ BufferLayout: GPUVertexBufferLayout, Buffer: GPUBuffer, VertexCount: number }> {
        const blob = await this.download(url);
        const Lines = await this.toLines(blob);

        const Result: number[] = [];

        const Verticies: vec3[] = [];
        const TextureCoords: vec2[] = [];
        const VertexNormals: vec3[] = [];

        Lines.forEach((Line) => {
            if (/^v /.test(Line)) {
                const vertex = this.applyVertex(Line, Verticies);
            }
            else if (/^vt /.test(Line)) {
                const texcoord = this.applyTextureCoord(Line, TextureCoords);
            }
            else if (/^vn /.test(Line)) {
                const normal = this.applyNormal(Line, VertexNormals);
            }
            else if (/^f /.test(Line)) {
                const face = this.applyFace({ Line, Result, Verticies, TextureCoords });
            }
        })

        const Vertices = new Float32Array(Result);
        const VertexCount = Vertices.length / 5;
        const BufferUsage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
        const BufferDescriptor: GPUBufferDescriptor = {
            size: Vertices.byteLength,
            usage: BufferUsage,
            mappedAtCreation: true
        };
        const Buffer = device.createBuffer(BufferDescriptor);

        new Float32Array(Buffer.getMappedRange()).set(Vertices);
        Buffer.unmap();

        const BufferLayout: GPUVertexBufferLayout = {
            arrayStride: 20,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x2",
                    offset: 12
                }
            ]
        };
        return { BufferLayout, Buffer, VertexCount };
    }
}