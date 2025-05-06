async function readFileFromURL(url: string) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch file: ${response.statusText}`);
		}
		const text = await response.text();
		return text;
	} catch (error) {
		console.error('Error reading file:', error);
		return null;
	}
}

export class ShaderImporter {
	private _fragmentSource: string | undefined;
	private _vertexSource: string | undefined;

	private _fragmentPath: string | undefined;
	private _vertexPath: string | undefined;

	private fragmentState: 'loaded' | 'failed' | 'loading' = 'loading';
	private vertexState: 'loaded' | 'failed' | 'loading' = 'loading';
	
	get state() {
		if (this.fragmentState === 'failed' || this.vertexState === 'failed') {
			return 'failed'
		} else if (this.fragmentState === 'loading' || this.vertexState === 'loading') {
			return 'loading'
		} else {
			return 'loaded'
		}
	}

	get fragment() {
		return this._fragmentSource
	}
	get vertex() {
		return this._vertexSource
	}

	
	set fragmentPath(path: string) {
		this._fragmentPath = path
		this.loadFragment()
	}
	set vertexPath(path: string) {
		this._vertexPath = path
		this.loadVertex()
	}
	get fragmentPath() {
		return this._fragmentPath || ''
	}
	get vertexpath() {
		return this._vertexPath || ''
	}
	async loadFragment() {
		this.fragmentState = 'loading'
		const fragment = await readFileFromURL(this.fragmentPath).catch(() => {
			this.fragmentState = 'failed'
		})
		if (this.fragmentState === 'loading' && fragment) {
			this._fragmentSource = fragment
		}
	}
	async loadVertex() {
		this.vertexState = 'loading'
		const vertex = await readFileFromURL(this.vertexPath).catch(() => {
			this.vertexState = 'failed'
		})
		if (this.vertexState === 'loading' && vertex) {
			this._vertexSource = vertex
		}
	}
	constructor(fragment: string, vertex: string) {
		this.fragmentPath = fragment
		this.vertexPath = vertex
	}
}