const pending = new Map<string, Promise<unknown>>()

/** Repeated clicks share the in-flight write; failures release it for retry. */
export function singleFlight<T>(key: string, action: () => Promise<T>): Promise<T> {
  const current = pending.get(key)
  if (current) return current as Promise<T>
  const request = Promise.resolve().then(action)
  pending.set(key, request)
  void request.finally(() => {
    if (pending.get(key) === request) pending.delete(key)
  }).catch(() => {})
  return request
}
