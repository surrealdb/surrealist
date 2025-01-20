type RGB = {
	r: number;
	g: number;
	b: number;
};

type Lab = {
	l: number;
	a: number;
	b: number;
};

export class ColorDistributor {
	private preferredColors: Lab[];
	private threshold: number;

	constructor(preferredColors: string[] = [], threshold = 0.5) {
		this.preferredColors = preferredColors.map((hex) => this.hexToLab(hex));
		this.threshold = threshold;
	}

	// Convert hex to RGB
	private hexToRgb(input: string): RGB {
		const hex = input.replace("#", "");
		const r = Number.parseInt(hex.substring(0, 2), 16);
		const g = Number.parseInt(hex.substring(2, 4), 16);
		const b = Number.parseInt(hex.substring(4, 6), 16);
		return { r, g, b };
	}

	// Convert RGB to Lab
	private rgbToLab(rgb: RGB): Lab {
		// Convert RGB to XYZ
		let r = rgb.r / 255;
		let g = rgb.g / 255;
		let b = rgb.b / 255;

		// Convert to sRGB
		r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
		g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
		b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

		// Convert to XYZ
		const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
		const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
		const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

		// XYZ to Lab
		const xn = 95.047;
		const yn = 100.0;
		const zn = 108.883;

		const fx = x / xn > 0.008856 ? (x / xn) ** (1 / 3) : (7.787 * x) / xn + 16 / 116;
		const fy = y / yn > 0.008856 ? (y / yn) ** (1 / 3) : (7.787 * y) / yn + 16 / 116;
		const fz = z / zn > 0.008856 ? (z / zn) ** (1 / 3) : (7.787 * z) / zn + 16 / 116;

		return {
			l: 116 * fy - 16,
			a: 500 * (fx - fy),
			b: 200 * (fy - fz),
		};
	}

	// Convert Lab to RGB
	private labToRgb(lab: Lab): RGB {
		let y = (lab.l + 16) / 116;
		let x = lab.a / 500 + y;
		let z = y - lab.b / 200;

		const yn = 100.0;
		const xn = 95.047;
		const zn = 108.883;

		x = xn * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
		y = yn * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
		z = zn * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);

		x = x / 100;
		y = y / 100;
		z = z / 100;

		// XYZ to RGB
		let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
		let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
		let b = x * 0.0557 + y * -0.204 + z * 1.057;

		// Convert to sRGB
		r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
		g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
		b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : 12.92 * b;

		return {
			r: Math.max(0, Math.min(255, Math.round(r * 255))),
			g: Math.max(0, Math.min(255, Math.round(g * 255))),
			b: Math.max(0, Math.min(255, Math.round(b * 255))),
		};
	}

	private hexToLab(hex: string): Lab {
		return this.rgbToLab(this.hexToRgb(hex));
	}

	// Convert RGB to hex string
	private rgbToHex(rgb: RGB): string {
		const toHex = (n: number): string => {
			const hex = n.toString(16);
			return hex.length === 1 ? `0${hex}` : hex;
		};
		return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
	}

	// Calculate color distance in Lab space
	private colorDistance(lab1: Lab, lab2: Lab): number {
		const deltaL = lab1.l - lab2.l;
		const deltaA = lab1.a - lab2.a;
		const deltaB = lab1.b - lab2.b;
		return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB) / 100;
	}

	// Find the nearest preferred color if within threshold
	private findNearestPreferredColor(lab: Lab): Lab | null {
		let nearestColor = null;
		let minDistance = Number.POSITIVE_INFINITY;

		for (const preferredColor of this.preferredColors) {
			const distance = this.colorDistance(lab, preferredColor);
			if (distance < minDistance) {
				minDistance = distance;
				nearestColor = preferredColor;
			}
		}

		return minDistance <= this.threshold ? nearestColor : null;
	}

	// Generate distributed colors in Lab space
	generateColors(count: number): string[] {
		const colors: Lab[] = [];
		const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
		const n = count;

		// Generate points on a sphere in Lab space
		for (let i = 0; i < n; i++) {
			const t = i / phi; // Golden angle
			const inclination = Math.acos(1 - (2 * (i + 0.5)) / n);
			const azimuth = 2 * Math.PI * t;

			// Convert spherical coordinates to Lab
			// Scale and shift to stay within typical Lab gamut
			const lab: Lab = {
				l: 65 + Math.cos(inclination) * 30, // L: 35-95
				a: Math.sin(inclination) * Math.cos(azimuth) * 60, // a: -60 to 60
				b: Math.sin(inclination) * Math.sin(azimuth) * 60, // b: -60 to 60
			};

			// Check for preferred colors
			const nearestPreferred = this.findNearestPreferredColor(lab);
			colors.push(nearestPreferred || lab);
		}

		// Convert Lab colors to hex strings
		return colors.map((lab) => this.rgbToHex(this.labToRgb(lab)));
	}
}
