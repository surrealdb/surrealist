import { useEffect, useMemo, useRef } from "react";
import { useStable } from "./stable";

type EventFn<T> = T extends undefined ? () => void : (value: T) => void;

export interface EventBus<T = undefined> {
	listeners: Set<EventFn<T>>;
	dispatch: EventFn<T>;
}

/**
 * Define a new event bus which dispatches events to all listeners.
 * 
 * @returns Event bus instance
 */
export function useEventBus<T = undefined>(): EventBus<T> {
	const listeners = useRef(new Set<(value: T) => void>()).current;

	const dispatch = useStable((value: T) => {
		for (const listener of listeners) {
			listener(value);
		}
	});

	return useMemo(() => ({
		listeners,
		dispatch
	}), []) as any;
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

	useEffect(() => {
		bus.listeners.add(stable);

		return () => {
			bus.listeners.delete(stable);
		};
	});
}