import {
	arrayMove,
	SortableContext,
} from "@dnd-kit/sortable";

import {
	DndContext,
	DragEndEvent,
	PointerActivationConstraint,
	closestCorners,
} from "@dnd-kit/core";

import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useStable } from "~/hooks/stable";
import { ReactNode } from "react";
import { useSortableDirection, useSortableSensors } from "./helpers";
import { SortableDrag, SortableItem } from "./types";
import { SortableChild } from "./child";

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
	const [strategy, modifier] = useSortableDirection(props.direction);
	const sensors = useSortableSensors(props.constraint);

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
			modifiers={[restrictToWindowEdges, ...(modifier ? [modifier] : [])]}
		>
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
