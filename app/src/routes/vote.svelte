<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';

	// Let's fetch the vote account data
	// const program = $workspaceStore.program as anchor.Program;
	// const provider = $workspaceStore.provider as anchor.AnchorProvider;
	let voteAccount;

	// === Helpers
	async function derivePda(seed: string) {
		// NOTE This is key! We can derive PDA WITHOUT hitting our program!
		// Then we can use this PDA address in our functions as a check to see
		// whether there is a ledger account at this PDA address.
		// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
		// and use its data.
		// NOTE pubkey is actually provider.wallet.publicKey
		let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from(seed)],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		return pda;
	}

	async function handleGetAccountData(seed: string) {
		// NOTE For testing purposes only. Taking input text and converting to correct types.
		// NOTE Must convert string to type Publickey
		let pda = await derivePda(seed);
		let data = await $workspaceStore.program?.account.voteAccount.fetch(pda);
		// voteAccount = data;
		return data;
	}

	async function createDataAccount(pda: anchor.web3.PublicKey) {
		// Calls the program's on-chain initialize instruction function
		// to create a vote account LOCATED at our generated PDA address!
		await $workspaceStore.program?.methods
			.initialize()
			.accounts({
				voteAccount: pda,
				wallet: $walletStore.publicKey as anchor.web3.PublicKey // OR: $walletStore.publicKey
				// NOTE Anchor automatically adds System Program (and other programs if required)
			})
			// NOTE FRONTEND: Don't need to pass signers() I guess....
			// .signers([wallet]) // Q: Need this? A: NO!
			.rpc();
	}

	async function handleCreateDataAccount() {
		let pda = await derivePda('vote-account');

		// If testing on localnet:
		if ($workspaceStore.network == 'http://localhost:8899') {
			// Airdrop some SOL to the wallet
			const airdropRequest = await $workspaceStore.connection.requestAirdrop(
				$walletStore.publicKey as anchor.web3.PublicKey,
				anchor.web3.LAMPORTS_PER_SOL * 2
			);
			await $workspaceStore.connection.confirmTransaction(airdropRequest);
		}

		try {
			// Q: How to pass a Keypair from walletStore? I have the signers([wallet]) for the ix
			// REF: https://solana.stackexchange.com/questions/1984/anchor-signing-and-paying-for-transactions-to-interact-with-program
			// REF: https://stackoverflow.com/questions/72549145/how-to-sign-and-call-anchor-solana-smart-contract-from-web-app
			// REF: https://www.youtube.com/watch?v=vt8GUw_PDqM
			// UPDATE: Looks like I can pass the $walletStore OR $workspaceStore.provider.wallet
			// UPDATE: Looks like you DON'T pass signers([wallet]) call from frontend,
			// since it fails if I pass it inside the program.methods.createLedger() call
			await createDataAccount(pda); // WORKS
			// await createDataAccount(color, pda, $workspaceStore.provider.wallet); // WORKS

			const data = await $workspaceStore.program?.account.voteAccount.fetch(pda);
			voteAccount = data;
			console.log('voteAccount: ', voteAccount);
		} catch (e) {
			console.error('handleCreateDataAccount::Error: ', e);
		}
	}
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Vote
		</h1>
		<div class="card w-96 bg-base-100 shadow-xl">
			<div class="card-body items-center text-center">
				<button class="btn btn-lg btn-accent" on:click={handleCreateDataAccount}
					>Initialize Vote</button
				>
				<p>Are you going to make it or not?</p>
				<div class="card-actions">
					<button class="btn btn-active btn-primary">GMI: </button>
					<button class="btn btn-active btn-ghost">NGMI: </button>
				</div>
			</div>
		</div>
	</div>
</div>
