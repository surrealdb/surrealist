import type { UniqueIdentifier } from "@dnd-kit/core";

export interface SortableItem {
	id: UniqueIdentifier;
}

export interface SortableDrag<T> {
	item: T;
	index: number;
	isDragging: boolean;
	handleProps: Record<string, any>;
}

export type SortableSlot<T> = (drag: SortableDrag<T>) => React.ReactNode;
