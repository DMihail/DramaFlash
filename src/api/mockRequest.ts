export const defaultMockDelayMs = 400;

export class MockRequestAborted extends Error {
  constructor() {
    super('The request was cancelled.');
    this.name = 'MockRequestAborted';
  }
}

export class MockRequestFailed extends Error {
  constructor() {
    super('The series could not be loaded.');
    this.name = 'MockRequestFailed';
  }
}

export function isMockRequestAborted(error: unknown): boolean {
  return error instanceof MockRequestAborted;
}

export type MockRequestOptions = {
  signal?: AbortSignal;
  delayMs?: number;
  fail?: boolean;
};

export function waitForMockDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new MockRequestAborted());
  }

  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new MockRequestAborted());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener('abort', onAbort);
  });
}

export async function runMockRequest(options?: MockRequestOptions): Promise<void> {
  const delayMs = options?.delayMs ?? defaultMockDelayMs;
  await waitForMockDelay(delayMs, options?.signal);

  if (options?.signal?.aborted) {
    throw new MockRequestAborted();
  }

  if (options?.fail) {
    throw new MockRequestFailed();
  }
}
