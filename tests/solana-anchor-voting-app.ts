import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SolanaAnchorVotingApp } from "../target/types/solana_anchor_voting_app";
import { expect } from "chai";

// describe("solana-anchor-voting-app", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace
//     .SolanaAnchorVotingApp as Program<SolanaAnchorVotingApp>;

//   // it("Is initialized!", async () => {
//   //   // Add your test here.
//   //   const tx = await program.methods.initialize().rpc();
//   //   console.log("Your transaction signature", tx);
//   // });

//   it("can submit vote", async () => {
//     const vote = anchor.web3.Keypair.generate();

//     // FIXME Following this example to call the methods:
//     // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
//     await program.methods
//       .submitVote("peanut butter poll", "crunchy")
//       .accounts({
//         vote: vote.publicKey,
//         user: (program.provider as anchor.AnchorProvider).wallet.publicKey,
//       })
//       .signers([vote])
//       .rpc();
//   });
// });

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

// ===== TEST code from crunchy-vs-smooth-v2 repo
// const assert = require("assert");
// const anchor = require("@project-serum/anchor");

describe("solana-anchor-voting-app", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SolanaAnchorVotingApp as Program<SolanaAnchorVotingApp>;

  // NOTE Original:
  // let voteAccount, voteAccountBump;
  // before(async () => {
  //   [voteAccount, voteAccountBump] =
  //     await anchor.web3.PublicKey.findProgramAddress(
  //       [Buffer.from("vote_account")],
  //       program.programId
  //     );
  // });

  it("Initializes with 0 votes for crunchy and smooth", async () => {
    // NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
    // NOTE They find the PDA address INSIDE the it() test!
    const [voteAccountPDA, voteAccountBump] =
      await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("vote-account"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

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
    
    await program.rpc.initialize(new anchor.BN(voteAccountBump), {
      accounts: {
        user: provider.wallet.publicKey,
        voteAccount: voteAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(0, currentVoteAccountState.crunchy.toNumber());
    assert.equal(0, currentVoteAccountState.smooth.toNumber());
  });

  it("Votes correctly for crunchy", async () => {
    await program.rpc.voteCrunchy({
      accounts: {
        voteAccount: voteAccount,
      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(1, currentVoteAccountState.crunchy.toNumber());
    assert.equal(0, currentVoteAccountState.smooth.toNumber());
  });

  it("Votes correctly for smooth", async () => {
    await program.rpc.voteSmooth({
      accounts: {
        voteAccount: voteAccount,
      },
    });

    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccount
    );
    assert.equal(1, currentVoteAccountState.crunchy.toNumber());
    assert.equal(1, currentVoteAccountState.smooth.toNumber());
  });
});
