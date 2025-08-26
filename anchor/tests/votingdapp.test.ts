import { Votingdapp } from '../target/types/votingdapp'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
const votingAddress = new PublicKey('JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H')
import IDL from '../target/idl/votingdapp.json'
describe('votingdapp', () => {
  let context
  let provider
  let votingProgram
  beforeAll(async () => {
    context = await startAnchor('', [{ name: 'votingdapp', programId: votingAddress }], [])
    provider = new BankrunProvider(context)
    votingProgram = new Program<Votingdapp>(IDL, provider)
  })

  it('Initialize Poll', async () => {
    const pollId = new anchor.BN(1)

    // derive the PDA for the poll using the poll_id seed (u64 little-endian)
    const pollSeed = Buffer.from(pollId.toArray('le', 8))
    const [pollPda] = PublicKey.findProgramAddressSync([pollSeed], votingAddress)

    await votingProgram.methods
      .initializePoll(pollId, 'What is your favorite peanut butter?', new anchor.BN(0), new anchor.BN(1856131203))
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync([pollSeed], votingAddress)
    const poll = await votingProgram.account.poll.fetch(pollAddress)
    console.log('Poll Account: ', poll)
    console.log(typeof poll.pollId)
    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual('What is your favorite peanut butter?')
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())
  })
  it('Initialize Candidate', async () => {
    await votingProgram.methods.initializeCandidate('Smooth', new anchor.BN(1)).rpc()
    await votingProgram.methods.initializeCandidate('Crunchy', new anchor.BN(1)).rpc()

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from(new anchor.BN(1).toArray('le', 8)), Buffer.from('Smooth')],
      votingAddress,
    )
    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from(new anchor.BN(1).toArray('le', 8)), Buffer.from('Crunchy')],
      votingAddress,
    )

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress)
    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress)
    console.log('Smooth Candidate: ', smoothCandidate)
    console.log('Crunchy Candidate: ', crunchyCandidate)
    expect(smoothCandidate.candidateName).toEqual('Smooth')
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0)
    expect(crunchyCandidate.candidateName).toEqual('Crunchy')
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  it('Vote candidate', async () => {
    await votingProgram.methods.vote('Smooth', new anchor.BN(1)).rpc()
    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from(new anchor.BN(1).toArray('le', 8)), Buffer.from('Smooth')],
      votingAddress,
    )
    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress)
    console.log('Smooth Candidate after vote: ', smoothCandidate)
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1)
  })
})
