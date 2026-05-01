import { useEffect, useLayoutEffect, useRef } from "react";
import { useStable } from "./stable";

type EventFn<T> = (value: T) => void;

export interface EventBus<T> {
	listeners: Set<EventFn<T>>;
	dispatch: EventFn<T>;
	cleanup: () => void;
}

/**
 * Define a new event bus which dispatches events to all listeners.
 *
 * @returns Event bus instance
 */
export function createEventBus<T>(): EventBus<T> {
	const listeners = new Set<EventFn<T>>();

	const dispatch = ((value: T) => {
		for (const listener of listeners) {
			listener(value);
		}
	}) as EventFn<T>;

	const cleanup = () => {
		listeners.clear();
	};

	return {
		listeners,
		dispatch,
		cleanup,
	};
}

/**
 * Define a new event bus which dispatches events to all listeners.
 *
 * @returns Event bus instance
 */
export function useEventBus<T>(): EventBus<T> {
	const bus = useRef<EventBus<T>>(null);

	if (!bus.current) {
		bus.current = createEventBus();
	}

	useEffect(() => {
		return () => bus.current?.cleanup();
	}, []);

	return bus.current;
}

/**
 * Subscribe to an event bus and call the callback when an event is dispatched.
 * The lifecycle of the subscription is tied to the component. The provided
 * callback does not have to be stable.
 *
 * @param bus The event bus to subscribe to
 * @param callback The callback to invoke when an event is dispatched
 */
export function useEventSubscription<T>(bus: EventBus<T>, callback: EventFn<T>) {
	const stable = useStable(callback);

	useLayoutEffect(() => {
		bus.listeners.add(stable);

		return () => {
			bus.listeners.delete(stable);
		};
	}, [bus]);
}

/**
 * Create an event subscription which can be manually cleaned up. This function is
 * intended for non-component code which needs to subscribe to events.
 *
 * @param bus The event bus to subscribe to
 * @param callback The callback to invoke when an event is dispatched
 * @returns Unsubscribe function
 */
export function createEventSubscription<T>(bus: EventBus<T>, callback: EventFn<T>): () => void {
	bus.listeners.add(callback);

	return () => {
		bus.listeners.delete(callback);
	};
}
