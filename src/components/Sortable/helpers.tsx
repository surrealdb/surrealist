import {
	KeyboardSensor,
	type PointerActivationConstraint,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	restrictToHorizontalAxis,
	restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
	horizontalListSortingStrategy,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const DIRECTIONS = {
	vertical: [verticalListSortingStrategy, restrictToVerticalAxis],
	horizontal: [horizontalListSortingStrategy, restrictToHorizontalAxis],
	grid: [rectSortingStrategy, null],
} as const;

export function useSortableSensors(constraint?: PointerActivationConstraint) {
	return useSensors(
		useSensor(PointerSensor, {
			activationConstraint: constraint,
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
}

export function useSortableDirection(
	direction?: "vertical" | "horizontal" | "grid",
) {
	return DIRECTIONS[direction || "vertical"];
}
