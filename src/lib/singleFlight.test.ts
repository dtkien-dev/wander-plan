import { describe, expect, it, vi } from 'vitest'
import { singleFlight } from './singleFlight'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise })
  return { promise, resolve, reject }
}

describe('singleFlight', () => {
  it('shares one in-flight request across ten concurrent calls with the same key', async () => {
    const request = deferred<string>()
    const action = vi.fn(() => request.promise)
    const calls = Array.from({ length: 10 }, () => singleFlight('create-trip-test', action))

    expect(action).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(action).toHaveBeenCalledTimes(1)
    expect(calls.every((call) => call === calls[0])).toBe(true)
    request.resolve('trip-1')
    await expect(Promise.all(calls)).resolves.toEqual(Array(10).fill('trip-1'))
  })

  it('releases a rejected request so the same key can be retried', async () => {
    const action = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce('recovered')

    await expect(singleFlight('retry-test', action)).rejects.toThrow('temporary failure')
    await expect(singleFlight('retry-test', action)).resolves.toBe('recovered')
    expect(action).toHaveBeenCalledTimes(2)
  })
})
