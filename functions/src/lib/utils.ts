import tmp from 'tmp';

// Enable graceful cleanup
tmp.setGracefulCleanup();

/**
 * Create a temporary directory with automatic cleanup
 *
 * @returns Promise resolving to an object with path and cleanup callback
 */
export async function createTempDir(): Promise<{
  path: string;
  cleanup: () => void;
}> {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, path, cleanup) => {
      if (err) reject(err);
      else resolve({ path, cleanup });
    });
  });
}
