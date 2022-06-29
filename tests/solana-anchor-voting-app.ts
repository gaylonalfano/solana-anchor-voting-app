import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaAnchorVotingApp } from "../target/types/solana_anchor_voting_app";

describe("solana-anchor-voting-app", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SolanaAnchorVotingApp as Program<SolanaAnchorVotingApp>;

  // it("Is initialized!", async () => {
  //   // Add your test here.
  //   const tx = await program.methods.initialize().rpc();
  //   console.log("Your transaction signature", tx);
  // });

  it("can submit vote", async () => {
    const vote = anchor.web3.Keypair.generate();

    // FIXME Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    await program.methods
      .submitVote("peanut butter poll", "crunchy")
      .accounts({
        vote: vote.publicKey,
        user: (program.provider as anchor.AnchorProvider).wallet.publicKey,
      })
      .signers([vote])
      .rpc();
  });
});

// // NOTE Without Anchor, we'd have something like this:
// // Read the generated IDL.
// const idl = JSON.parse(
//   require("fs").readFileSync("./target/idl/basic_0_json", "utf8")
// );

// // 2. Address of the deployed program
// const programId = new anchor.web3.PublicKey("<YOUR-PROGRAM-ID>");

// // 3. Generate the program client from IDL
// const program = new anchor.Program(idl, programId);
// // NOTE This is where Anchor's 'workspace' object used in testing comes handy:
// // const program = anchor.workspace.Basic0;

// // 4. Execute the RPC
// await program.rpc.initialize();
