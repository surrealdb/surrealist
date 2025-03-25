import { useEffect } from "react";

export function createLock() {
    const { promise: lock, resolve } = Promise.withResolvers<void>();

    function Resolve() {
        useEffect(() => {
            resolve();
        }, []);

        return null;
    }

    return { Resolve, lock };
}