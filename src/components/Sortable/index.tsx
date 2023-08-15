import {
	arrayMove,
	horizontalListSortingStrategy,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	UniqueIdentifier,
	DragEndEvent,
	PointerActivationConstraint,
	closestCorners,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStable } from "~/hooks/stable";
import { ReactNode } from "react";

interface SortableItem {
	id: UniqueIdentifier;
}

interface SortableDrag<T> {
	item: T;
	index: number;
	isDragging: boolean;
	handleProps: Record<string, any>;
}

interface SortableChildProps<T> {
	item: T;
	disabled: boolean;
	children: (drag: SortableDrag<T>) => React.ReactNode;
}

const DIRECTIONS = {
	vertical: [verticalListSortingStrategy, restrictToVerticalAxis],
	horizontal: [horizontalListSortingStrategy, restrictToHorizontalAxis],
	grid: [rectSortingStrategy, null],
} as const;

function SortableChild<T extends SortableItem>({ item, children, disabled }: SortableChildProps<T>) {
	const { index, isDragging, attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: item.id,
		disabled,
	});

	const style: React.CSSProperties = {
		cursor: "grab",
	};

	// NOTE - The translate property appears to cause font weight to drop for me, seems like an Edge skill issue

	const childStyle: React.CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		zIndex: isDragging ? 9999 : 0,
	};

	const drag = {
		item,
		index,
		isDragging,
		handleProps: { ...attributes, ...listeners, style },
	};

	return (
		<div ref={setNodeRef} style={childStyle}>
			{children(drag)}
		</div>
	);
}

export interface SortableProps<T> {
	items: T[];
	direction?: "vertical" | "horizontal" | "grid";
	constraint?: PointerActivationConstraint;
	disabled?: boolean;
	onSorting?: () => void;
	onSorted: (value: T[]) => void;
	children: (drag: SortableDrag<T>) => ReactNode;
}

export function Sortable<T extends SortableItem>(props: SortableProps<T>) {
	const [strategy, modifier] = DIRECTIONS[props.direction || "vertical"];

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: props.constraint,
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = useStable((event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const oldIndex = props.items.findIndex((i) => i.id === active.id);
		const newIndex = props.items.findIndex((i) => i.id === over.id);
		const moved = arrayMove(props.items, oldIndex, newIndex);

		props.onSorted(moved);
	});

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={props.onSorting}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToWindowEdges, ...(modifier ? [modifier] : [])]}>
			<SortableContext items={props.items} strategy={strategy}>
				{props.items.map((item) => (
					<SortableChild key={item.id} item={item} disabled={props.disabled ?? false}>
						{props.children}
					</SortableChild>
				))}
			</SortableContext>
		</DndContext>
	);
}
