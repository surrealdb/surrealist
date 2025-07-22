import { GeometryPoint } from "surrealdb";

interface Props {
	value: GeometryPoint;
	onChange: (value: GeometryPoint) => void;
}

export function GeometryPointEditor({ value, onChange }: Props) {
	return "I'm a point editor";
}
