/**
 * Read content from stdin (non-blocking)
 */
export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
    process.stdin.on('error', () => resolve(''));

    // Timeout to avoid hanging
    setTimeout(() => {
      if (chunks.length === 0) {
        resolve('');
      }
    }, 100);
  });
}
