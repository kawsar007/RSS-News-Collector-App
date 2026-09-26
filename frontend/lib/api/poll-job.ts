import { FetchJobStatus } from "@/types/news-source";

interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

/**
 * Polls a job status endpoint until it reaches a terminal state
 * ('completed' or 'failed'), or until timeoutMs elapses.
 *
 * This is a plain async function, not tied to React — it can be awaited
 * from any event handler. Cancellation-on-unmount is handled by the
 * caller checking a `cancelled` flag (see sources/page.tsx).
 */
export async function pollJobUntilDone(
  fetchStatus: (jobId: string) => Promise<FetchJobStatus>,
  jobId: string,
  isCancelled: () => boolean,
  options: PollOptions = {},
): Promise<FetchJobStatus> {
  const intervalMs = options.intervalMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 30000;
  const startedAt = Date.now();

  while (true) {
    if (isCancelled()) {
      throw new Error("Polling cancelled");
    }

    const status = await fetchStatus(jobId);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for fetch job to complete");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
