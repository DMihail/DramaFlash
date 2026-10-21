import { type MockRequestOptions, runMockRequest } from '@/api/mockRequest';
import { catalog, type Series } from '@/data/catalog';

export type DiscoverLoader = (options?: MockRequestOptions) => Promise<readonly Series[]>;

export async function fetchDiscoverCatalog(
  options?: MockRequestOptions,
): Promise<readonly Series[]> {
  await runMockRequest(options);
  return catalog;
}
