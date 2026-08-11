import { useEffect, useRef } from "react";
import globulesImg from "~/assets/images/globules.webp";
import { useSetting } from "~/hooks/config";

/**
 * Render-scale for the WebGL drawing buffer, relative to the element's CSS
 * size. Kept at 1.0 (rather than the device pixel ratio) so the shader's
 * per-pixel dither lands on whole pixels and effectively breaks up gradient
 * banding — a downscaled buffer would have the dither blurred away on upscale.
 */
const RENDER_SCALE = 1;

const VERTEX_SHADER = /* glsl */ `
	attribute vec2 a_position;
	void main() {
		gl_Position = vec4(a_position, 0.0, 1.0);
	}
`;

// A field of small magenta-to-violet "globules" over a fully transparent base.
// The source artwork is ~95% transparent (peak alpha ~26%); only the blobs show,
// composited over the dark app background via the canvas CSS opacity. Globules
// are placed on a jittered grid so they cover the whole canvas evenly (rather
// than clumping), and each drifts within its cell, slowly pulses in size, and is
// squashed/rotated by a breathing anisotropic transform so the shapes wobble
// independently and the motion never visibly loops. Output is premultiplied
// alpha (rgb already multiplied by a) to match the context.
const GLOBULE_COLS = 5;
const GLOBULE_ROWS = 3;

const FRAGMENT_SHADER = /* glsl */ `
	precision mediump float;

	uniform vec2 u_resolution;
	uniform float u_time;
	uniform float u_opacity;

	const int COLS = ${GLOBULE_COLS};
	const int ROWS = ${GLOBULE_ROWS};
	const int COUNT = ${GLOBULE_COLS * GLOBULE_ROWS};

	// Deterministic pseudo-random in [0,1] from a scalar seed.
	float hash(float n) {
		return fract(sin(n) * 43758.5453123);
	}

	// Screen-space pseudo-random in [0,1] for dithering.
	float hash2(vec2 p) {
		return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
	}

	void main() {
		vec2 uv = gl_FragCoord.xy / u_resolution;
		// Correct for aspect ratio so globules stay round.
		float aspect = u_resolution.x / u_resolution.y;
		uv.x *= aspect;

		float t = u_time;
		float ax = aspect;

		float cellW = ax / float(COLS);
		float cellH = 1.0 / float(ROWS);

		// Accumulate coverage-weighted colour from every globule. Colour is the
		// weighted average tint; alpha is the (clamped) total coverage.
		vec3 col = vec3(0.0);
		float cover = 0.0;

		vec3 magenta = vec3(0.80, 0.20, 0.59);
		vec3 violet = vec3(0.60, 0.22, 0.78);

		for (int i = 0; i < COUNT; i++) {
			float fi = float(i);
			float hr = hash(fi * 2.1 + 2.0);
			float hp = hash(fi * 5.0 + 3.0);   // phase offset
			float hc = hash(fi * 0.9 + 4.0);   // colour mix
			float ph = hp * 6.2831;

			// Stratified placement: one globule per grid cell, jittered within it.
			float colIx = mod(fi, float(COLS));
			float rowIx = floor(fi / float(COLS));
			float jx = (hash(fi * 1.7 + 0.3) - 0.5) * 0.7;
			float jy = (hash(fi * 3.3 + 1.0) - 0.5) * 0.7;
			vec2 base = vec2((colIx + 0.5 + jx) * cellW, (rowIx + 0.5 + jy) * cellH);

			// Drift around the cell on a slow lissajous path (stays roughly local
			// so overall coverage remains even).
			vec2 drift = vec2(
				0.45 * cellW * sin(t * (0.09 + 0.05 * hr) + ph),
				0.45 * cellH * cos(t * (0.08 + 0.05 * hc) + ph * 1.3)
			);
			vec2 center = base + drift;

			// Pulse the radius (resize) between roughly half and full.
			float radius = mix(0.11, 0.19, hr) * (0.78 + 0.22 * sin(t * (0.10 + 0.07 * hp) + ph));

			// Reshape: rotate then squash on each axis with a breathing aspect.
			float a = t * 0.04 + ph;
			float ca = cos(a), sa = sin(a);
			vec2 d = uv - center;
			vec2 dd = vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
			dd.x /= (1.0 + 0.35 * sin(t * 0.07 + ph));
			dd.y /= (1.0 + 0.35 * cos(t * 0.06 + ph * 0.7));

			float dist = length(dd) / radius;
			float w = (0.17 + 0.12 * hr) * exp(-dist * dist);

			cover += w;
			col += mix(magenta, violet, hc) * w;
		}

		vec3 tint = cover > 0.0001 ? col / cover : vec3(0.0);
		// Bake the overall opacity in here (rather than via CSS) so there is a
		// single quantisation into the 8-bit buffer that the dither can break up.
		float alpha = min(cover, 0.40) * u_opacity;

		// Dither by ~1 LSB to break up 8-bit gradient banding in the very gradual
		// falloff. Applied to the premultiplied output right before it is quantised
		// into the buffer; static (screen-space only) so it never shimmers.
		float d = (hash2(gl_FragCoord.xy) - 0.5) / 255.0;

		// Premultiplied alpha output.
		gl_FragColor = vec4(tint * alpha + d, alpha + d);
	}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

export interface GlobulesBackgroundProps {
	/** Overall opacity of the effect (0 - 1). */
	opacity: number;
	/** Animation speed (0 - 1), where 0 freezes the animation. */
	speed: number;
}

/**
 * An animated WebGL rendition of the globules background. Drifting coloured
 * blobs are drawn by a single full-screen fragment shader (one draw call), and
 * the loop pauses whenever it would not be visible — when the speed is zero,
 * the document is hidden, or the user has requested reduced motion.
 */
export function GlobulesBackground({ opacity, speed }: GlobulesBackgroundProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [disableAnimations] = useSetting("appearance", "disableAnimations");

	// Latest speed/opacity kept in refs so the render loop reads them without
	// restarting the WebGL setup.
	const speedRef = useRef(speed);
	const opacityRef = useRef(opacity);

	// Lets the speed/opacity effects re-arm the render loop when it has gone idle.
	const wakeRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl", {
			alpha: true,
			premultipliedAlpha: true,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: "low-power",
		});

		// If WebGL is unavailable, fall back to the original static image.
		if (!gl) {
			canvas.style.backgroundImage = `url(${globulesImg})`;
			canvas.style.backgroundSize = "cover";
			canvas.style.backgroundPosition = "center";
			canvas.style.opacity = String(opacityRef.current);
			return;
		}

		const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		const program = gl.createProgram();

		if (!vertex || !fragment || !program) {
			canvas.style.backgroundImage = `url(${globulesImg})`;
			canvas.style.backgroundSize = "cover";
			canvas.style.backgroundPosition = "center";
			canvas.style.opacity = String(opacityRef.current);
			return;
		}

		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		// biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook
		gl.useProgram(program);

		// Full-screen quad as two triangles.
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW,
		);

		const positionLoc = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
		const timeLoc = gl.getUniformLocation(program, "u_time");
		const opacityLoc = gl.getUniformLocation(program, "u_opacity");

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const resize = () => {
			const width = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE));
			const height = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE));
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}
		};

		// Virtual animation clock, advanced by the (speed-scaled) delta each frame
		// so changing the speed never causes a visible time jump.
		let clock = 0;
		let lastTime: number | null = null;
		let frame = 0;

		const draw = () => {
			resize();
			gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
			gl.uniform1f(timeLoc, clock);
			gl.uniform1f(opacityLoc, opacityRef.current);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		};

		const render = (now: number) => {
			const animate = speedRef.current > 0 && !disableAnimations && !reducedMotion;

			if (animate) {
				if (lastTime !== null) {
					const delta = (now - lastTime) / 1000;
					clock += delta * speedRef.current;
				}
				lastTime = now;
				draw();
				frame = requestAnimationFrame(render);
			} else {
				// Draw a single static frame and idle until conditions change.
				lastTime = null;
				draw();
			}
		};

		// Paint an immediate static frame. drawArrays renders regardless of tab
		// visibility, so the globules are present even before (or without) the
		// animation loop — browsers pause requestAnimationFrame in hidden tabs.
		draw();
		frame = requestAnimationFrame(render);

		// Resume the loop when the speed becomes non-zero or the tab is revealed.
		const wake = () => {
			cancelAnimationFrame(frame);
			lastTime = null;
			frame = requestAnimationFrame(render);
		};
		wakeRef.current = wake;

		const observer = new ResizeObserver(() => {
			// Keep the drawing buffer matched to the element on every layout
			// change, redrawing immediately — this also covers the case where the
			// canvas first receives its size while the rAF loop is paused.
			draw();
		});
		observer.observe(canvas);

		const onVisibility = () => {
			if (!document.hidden) {
				wake();
			}
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			cancelAnimationFrame(frame);
			wakeRef.current = null;
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertex);
			gl.deleteShader(fragment);
		};
	}, [disableAnimations]);

	// Keep the loop reading the latest speed/opacity, and re-arm it when either
	// changes (e.g. speed from 0, where the loop has gone idle, to moving, or an
	// opacity change that must be redrawn while idle).
	useEffect(() => {
		speedRef.current = speed;
		opacityRef.current = opacity;
		wakeRef.current?.();
	}, [speed, opacity]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				zIndex: 0,
				pointerEvents: "none",
			}}
		/>
	);
}
