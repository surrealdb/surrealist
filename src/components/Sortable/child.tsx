import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortableItem, SortableSlot } from "./types";

type Options = Parameters<typeof useSortable>[0];

export interface SortableChildProps<T> {
	item: T;
	disabled?: boolean;
	children: SortableSlot<T>;
	options?: Options;
}

export function SortableChild<T extends SortableItem>({
	item,
	children,
	disabled,
	options,
}: SortableChildProps<T>) {
	const { index, isDragging, attributes, listeners, setNodeRef, transform, transition } =
		useSortable({
			id: item.id,
			disabled,
			...options,
		});

	const style: React.CSSProperties = {
		cursor: "grab",
	};

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
		<div
			ref={setNodeRef}
			style={childStyle}
		>
			{children(drag)}
		</div>
	);
}
