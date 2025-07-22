import {
	GeometryCollection,
	GeometryLine,
	GeometryMultiLine,
	GeometryMultiPoint,
	GeometryMultiPolygon,
	GeometryPoint,
	GeometryPolygon,
} from "surrealdb";
import { GeographyInput } from "../GeographyMap";

export const isGeometryPoint = (data: GeographyInput): data is GeometryPoint => {
	return data instanceof GeometryPoint;
};

export const isGeometryLineString = (data: GeographyInput): data is GeometryLine => {
	return data instanceof GeometryLine;
};

export const isGeometryPolygon = (data: GeographyInput): data is GeometryPolygon => {
	return data instanceof GeometryPolygon;
};

export const isGeometryMultiPoint = (data: GeographyInput): data is GeometryMultiPoint => {
	return data instanceof GeometryMultiPoint;
};

export const isGeometryMultiLine = (data: GeographyInput): data is GeometryMultiLine => {
	return data instanceof GeometryMultiLine;
};

export const isGeometryMultiPolygon = (data: GeographyInput): data is GeometryMultiPolygon => {
	return data instanceof GeometryMultiPolygon;
};

export const isGeometryCollection = (data: GeographyInput): data is GeometryCollection => {
	return data instanceof GeometryCollection;
};
