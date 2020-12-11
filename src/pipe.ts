/* eslint-disable @typescript-eslint/naming-convention */
import { Processed } from './types';

export type EventuallyProcessed<Sync> = Sync extends true
  ? Processed
  : Processed | Promise<Processed>;

const pipe: <Sync>(
  sync: Sync,
  start: () => EventuallyProcessed<Sync>,
  ...then: Array<(processed: Processed) => EventuallyProcessed<Sync>>
) => EventuallyProcessed<Sync> = (sync, start, ...then) =>
  ((sync ? pipe_sync : pipe_async) as any)(start, ...then);

async function pipe_async(
  start: () => Promise<Processed>,
  ...then: Array<(processed: Processed) => Promise<Processed>>
) {
  let processed = await start();

  for (let i = 0; i < then.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    processed = await then[i](processed);
  }

  return processed;
}

function pipe_sync(
  start: () => Processed,
  ...then: Array<(processed: Processed) => Processed>
) {
  let processed = start();

  for (let i = 0; i < then.length; i++) {
    processed = then[i](processed);
  }

  return processed;
}

export default pipe;
