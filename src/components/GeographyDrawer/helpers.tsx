import {
	Geometry,
	GeometryCollection,
	GeometryLine,
	GeometryMultiLine,
	GeometryMultiPoint,
	GeometryMultiPolygon,
	GeometryPoint,
	GeometryPolygon,
} from "surrealdb";
import { GeographyInput } from "../GeographyMap";
import type { GeoJSON } from "geojson";

export const isGeometryPoint = (
	data: GeographyInput | GeoJSON,
): data is GeometryPoint => {
	return (
		data instanceof GeometryPoint || ("type" in data && data.type === "Point")
	);
};

export const isGeometryLineString = (
	data: GeographyInput | GeoJSON,
): data is GeometryLine => {
	return (
		data instanceof GeometryLine ||
		("type" in data && data.type === "LineString")
	);
};

export const isGeometryPolygon = (
	data: GeographyInput | GeoJSON,
): data is GeometryPolygon => {
	return (
		data instanceof GeometryPolygon ||
		("type" in data && data.type === "Polygon")
	);
};

export const isGeometryMultiPoint = (
	data: GeographyInput | GeoJSON,
): data is GeometryMultiPoint => {
	return (
		data instanceof GeometryMultiPoint ||
		("type" in data && data.type === "MultiPoint")
	);
};

export const isGeometryMultiLine = (
	data: GeographyInput | GeoJSON,
): data is GeometryMultiLine => {
	return (
		data instanceof GeometryMultiLine ||
		("type" in data && data.type === "MultiLineString")
	);
};

export const isGeometryMultiPolygon = (
	data: GeographyInput | GeoJSON,
): data is GeometryMultiPolygon => {
	return (
		data instanceof GeometryMultiPolygon ||
		("type" in data && data.type === "MultiPolygon")
	);
};

export const isGeometryCollection = (
	data: GeographyInput | GeoJSON,
): data is GeometryCollection => {
	return (
		data instanceof GeometryCollection ||
		("type" in data && data.type === "GeometryCollection")
	);
};

export function getGeometryTypeName(data: GeographyInput | GeoJSON): string {
	if (isGeometryPoint(data)) return "Point";
	if (isGeometryLineString(data)) return "LineString";
	if (isGeometryPolygon(data)) return "Polygon";
	if (isGeometryMultiPoint(data)) return "MultiPoint";
	if (isGeometryMultiLine(data)) return "MultiLineString";
	if (isGeometryMultiPolygon(data)) return "MultiPolygon";
	if (isGeometryCollection(data)) return "GeometryCollection";
	return "Unknown";
}

export const isGeoJSON = (data: GeographyInput | GeoJSON): data is GeoJSON => {
	return "type" in data;
};

export function convertGeoJSONToGeometry<T extends GeographyInput>(
	data: GeographyInput | GeoJSON,
): T {
	return normalizeGeometry(data) as T;
}

/**
 * Convert any GeoJSON-like geometry or Surreal geometry instance into a Surreal geometry instance.
 * Handles deep reconstruction for nested geometry types.
 */
export function normalizeGeometry(
	data: GeographyInput | GeoJSON,
): GeographyInput {
	// Already a Surreal geometry instance
	if (
		data instanceof GeometryPoint ||
		data instanceof GeometryLine ||
		data instanceof GeometryPolygon ||
		data instanceof GeometryMultiPoint ||
		data instanceof GeometryMultiLine ||
		data instanceof GeometryMultiPolygon ||
		data instanceof GeometryCollection
	) {
		return data as GeographyInput;
	}

	// GeoJSON conversions
	if (isGeoJSON(data) && data.type === "Point") {
		return new GeometryPoint(data.coordinates as [number, number]);
	}

	if (isGeoJSON(data) && data.type === "LineString") {
		const points = (data.coordinates as [number, number][])?.map(
			(coord) => new GeometryPoint(coord),
		);
		return new GeometryLine(
			points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
		);
	}

	if (isGeoJSON(data) && data.type === "Polygon") {
		const lines = (data.coordinates as [number, number][][])?.map((ring) => {
			const points = ring.map((coord) => new GeometryPoint(coord));
			return new GeometryLine(
				points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);
		});
		return new GeometryPolygon(lines as [GeometryLine, ...GeometryLine[]]);
	}

	if (isGeoJSON(data) && data.type === "MultiPoint") {
		const points = (data.coordinates as [number, number][])?.map(
			(coord) => new GeometryPoint(coord),
		);
		return new GeometryMultiPoint(
			points as [GeometryPoint, ...GeometryPoint[]],
		);
	}

	if (isGeoJSON(data) && data.type === "MultiLineString") {
		const lines = (data.coordinates as [number, number][][])?.map((line) => {
			const points = line.map((coord) => new GeometryPoint(coord));
			return new GeometryLine(
				points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);
		});
		return new GeometryMultiLine(lines as [GeometryLine, ...GeometryLine[]]);
	}

	if (isGeoJSON(data) && data.type === "MultiPolygon") {
		const polygons = (data.coordinates as [number, number][][][])?.map(
			(polygon) => {
				const lines = polygon.map((ring) => {
					const points = ring.map((coord) => new GeometryPoint(coord));
					return new GeometryLine(
						points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
					);
				});
				return new GeometryPolygon(lines as [GeometryLine, ...GeometryLine[]]);
			},
		);
		return new GeometryMultiPolygon(
			polygons as [GeometryPolygon, ...GeometryPolygon[]],
		);
	}

	if (isGeoJSON(data) && data.type === "GeometryCollection") {
		const geometries = (data.geometries ?? []).map((g) =>
			normalizeGeometry(g as any),
		);
		return new GeometryCollection(
			geometries as unknown as [Geometry, ...Geometry[]],
		);
	}

	throw new Error("Invalid GeoJSON data");
}

/** Convert a list of GeoJSON or Surreal geometries into Surreal geometry instances. */
export function normalizeGeometryArray(
	inputs: Array<GeographyInput | GeoJSON>,
): GeographyInput[] {
	return inputs.map((g) => normalizeGeometry(g));
}

export type GeometryType =
	| "Point"
	| "LineString"
	| "Polygon"
	| "MultiPoint"
	| "MultiLineString"
	| "MultiPolygon";

export function initializeGeometry(type: GeometryType): GeographyInput {
	switch (type) {
		case "Point":
			return new GeometryPoint([0, 0]);
		case "LineString":
			return new GeometryLine([
				new GeometryPoint([0, 0]),
				new GeometryPoint([0, 0]),
			]);
		case "Polygon":
			return new GeometryPolygon([
				new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0, 0]),
					new GeometryPoint([0, 0]),
					new GeometryPoint([0, 0]),
				]),
			]);
		case "MultiPoint":
			return new GeometryMultiPoint([new GeometryPoint([0, 0])]);
		case "MultiLineString":
			return new GeometryMultiLine([
				new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0, 0]),
				]),
			]);
		case "MultiPolygon":
			return new GeometryMultiPolygon([
				new GeometryPolygon([
					new GeometryLine([
						new GeometryPoint([0, 0]),
						new GeometryPoint([0, 0]),
						new GeometryPoint([0, 0]),
						new GeometryPoint([0, 0]),
					]),
				]),
			]);
		default:
			throw new Error(`Invalid geometry type: ${type}`);
	}
}
