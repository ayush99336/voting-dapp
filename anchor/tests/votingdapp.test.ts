import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchVotingdapp,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'

import fs from 'fs'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'
const IDL = require('../target/idl/votingdapp.json')
import { Votingdapp } from '../target/types/votingdapp.ts'
const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('votingdapp', () => {
  let payer: KeyPairSigner
  let votingdapp: KeyPairSigner

  beforeAll(async () => {
    votingdapp = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize votingdapp', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, votingdapp: votingdapp })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentvotingdapp = await fetchVotingdapp(rpc, votingdapp.address)
    expect(currentvotingdapp.data.count).toEqual(0)
  })

  // it('Increment votingdapp', async () => {
  //   // ARRANGE
  //   expect.assertions(1)
  //   const ix = getIncrementInstruction({
  //     votingdapp: votingdapp.address,
  //   })

  //   // ACT
  //   await sendAndConfirm({ ix, payer })

  //   // ASSERT
  //   const currentCount = await fetchVotingdapp(rpc, votingdapp.address)
  //   expect(currentCount.data.count).toEqual(1)
  // })

  // it('Increment votingdapp Again', async () => {
  //   // ARRANGE
  //   expect.assertions(1)
  //   const ix = getIncrementInstruction({ votingdapp: votingdapp.address })

  //   // ACT
  //   await sendAndConfirm({ ix, payer })

  //   // ASSERT
  //   const currentCount = await fetchVotingdapp(rpc, votingdapp.address)
  //   expect(currentCount.data.count).toEqual(2)
  // })

  // it('Decrement votingdapp', async () => {
  //   // ARRANGE
  //   expect.assertions(1)
  //   const ix = getDecrementInstruction({
  //     votingdapp: votingdapp.address,
  //   })

  //   // ACT
  //   await sendAndConfirm({ ix, payer })

  //   // ASSERT
  //   const currentCount = await fetchVotingdapp(rpc, votingdapp.address)
  //   expect(currentCount.data.count).toEqual(1)
  // })

  // it('Set votingdapp value', async () => {
  //   // ARRANGE
  //   expect.assertions(1)
  //   const ix = getSetInstruction({ votingdapp: votingdapp.address, value: 42 })

  //   // ACT
  //   await sendAndConfirm({ ix, payer })

  //   // ASSERT
  //   const currentCount = await fetchVotingdapp(rpc, votingdapp.address)
  //   expect(currentCount.data.count).toEqual(42)
  // })

  // it('Set close the votingdapp account', async () => {
  //   // ARRANGE
  //   expect.assertions(1)
  //   const ix = getCloseInstruction({
  //     payer: payer,
  //     votingdapp: votingdapp.address,
  //   })

  //   // ACT
  //   await sendAndConfirm({ ix, payer })

  //   // ASSERT
  //   try {
  //     await fetchVotingdapp(rpc, votingdapp.address)
  //   } catch (e) {
  //     if (!isSolanaError(e)) {
  //       throw new Error(`Unexpected error: ${e}`)
  //     }
  //     expect(e.message).toEqual(`Account not found at address: ${votingdapp.address}`)
  //   }
  // })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
