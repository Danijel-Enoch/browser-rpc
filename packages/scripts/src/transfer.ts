import { createWalletClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'

const client = createWalletClient({
  chain: base,
  transport: http('http://localhost:8545'),
})

async function main() {
  // This will be intercepted by rpc-proxy and opened in the browser
  // The actual "from" address will be set by the connected wallet
  const hash = await client.sendTransaction({
    to: '0x0000000000000000000000000000000000000000',
    value: parseEther('0.0001'),
  })

  console.log('Transaction hash:', hash)
}

main().catch(console.error)
