
async function test(url) {
  try {
    console.log(`Fetching ${url}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log(`${url} Status:`, response.status);
  } catch (error) {
    console.error(`${url} Error:`, error.message);
  }
}

await test('https://google.com');
await test('https://cloudflare-eth.com');
