import { GeographyInput } from "../GeographyMap";
import {
	isGeometryCollection,
	isGeometryLineString,
	isGeometryMultiLine,
	isGeometryMultiPoint,
	isGeometryMultiPolygon,
	isGeometryPoint,
	isGeometryPolygon,
} from "./helpers";
import { GeometryPointEditor } from "./Editor/GeometryPointEditor";
import { GeometryLineEditor } from "./Editor/GeometryLineEditor";
import { GeometryPolygonEditor } from "./Editor/GeometryPolygonEditor";
import { GeometryMultiLineEditor } from "./Editor/GeometryMultiLineEditor";
import { GeometryMultiPointEditor } from "./Editor/GeometryMultiPointEditor";
import { GeometryMultiPolygonEditor } from "./Editor/GeometryMultiPolygonEditor";
import { GeometryCollectionEditor } from "./Editor/GeometryCollectionEditor";

interface Props {
	value: GeographyInput;
	onChange: (value: GeographyInput) => void;
}

export function GeographyDrawerEditor({ value, onChange }: Props) {
	if (isGeometryPoint(value)) {
		return <GeometryPointEditor value={value} onChange={onChange} />;
	}

	if (isGeometryLineString(value)) {
		return <GeometryLineEditor value={value} onChange={onChange} />;
	}

	if (isGeometryPolygon(value)) {
		return <GeometryPolygonEditor value={value} onChange={onChange} />;
	}

	if (isGeometryMultiPoint(value)) {
		return <GeometryMultiPointEditor value={value} onChange={onChange} />;
	}

	if (isGeometryMultiLine(value)) {
		return <GeometryMultiLineEditor value={value} onChange={onChange} />;
	}

	if (isGeometryMultiPolygon(value)) {
		return <GeometryMultiPolygonEditor value={value} onChange={onChange} />;
	}

	if (isGeometryCollection(value)) {
		return <GeometryCollectionEditor value={value} onChange={onChange} />;
	}

	return null;
}
