export function timeoutPromise<T>(cb: () => Promise<T>, timeout = 1) {
  return new Promise<T>((res, rej) =>
    setTimeout(() => cb().then(res).catch(rej), timeout)
  );
}
