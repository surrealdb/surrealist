import Sigma from "sigma";
import { Settings } from "sigma/settings";

/**
 * Save a snapshot of the graph as a PNG file.
 * 
 * @param renderer The sigma instance
 * @returns The binary data
 */
export async function createSnapshot(
	renderer: Sigma,
	type: string,
	background: string | null,
	scale: number,
	config: Partial<Settings>
): Promise<Blob> {
	let { width, height } = renderer.getDimensions();

	width *= scale;
	height *= scale;

	const pixelRatio = window.devicePixelRatio || 1;
	const tmpRoot = document.createElement('div');

	tmpRoot.style.width = `${width}px`;
	tmpRoot.style.height = `${height}px`;
	tmpRoot.style.position = "absolute";
	tmpRoot.style.right = "101%";
	tmpRoot.style.bottom = "101%";

	document.body.appendChild(tmpRoot);

	// Instantiate sigma
	const base = renderer.getSettings();
	const sigma = renderer.getGraph().copy();

	sigma.nodes().forEach((node) => {
		sigma.setNodeAttribute(node, 'size', sigma.getNodeAttribute(node, 'size') * scale);
	});

	sigma.edges().forEach((node) => {
		sigma.setEdgeAttribute(node, 'size', sigma.getEdgeAttribute(node, 'size') * scale);
	});

	const tmpRenderer = new Sigma(sigma, tmpRoot, {
		...base,
		...config,
		labelSize: base.labelSize * scale,
		edgeLabelSize: base.edgeLabelSize * scale,
	});
 
	// Copy camera and force to render now
	tmpRenderer.getCamera().updateState(s => ({
		ratio: s.ratio + (scale * 0.025),
	}));

	tmpRenderer.refresh();

	// Create a new canvas, on which the different layers will be drawn
	const canvas = document.createElement('canvas') as HTMLCanvasElement;

	canvas.setAttribute("width", width * pixelRatio + "");
	canvas.setAttribute("height", height * pixelRatio + "");
	
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	// Draw a white background first
	if (background) {
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio);
	}

	// For each layer, draw it on our canvas
	const canvases = tmpRenderer.getCanvases();
	const layers = ['edges', 'nodes', 'edgeLabels', 'labels'];

	layers.forEach((id) => {
		ctx.drawImage(
			canvases[id],
			0,
			0,
			width * pixelRatio,
			height * pixelRatio,
			0,
			0,
			width * pixelRatio,
			height * pixelRatio,
		);
	});

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			tmpRenderer.kill();
			tmpRoot.remove();

			if (blob) {
				resolve(blob)
			} else {
				reject(new Error('Failed to create image'));
			}
		}, type);
	});
}