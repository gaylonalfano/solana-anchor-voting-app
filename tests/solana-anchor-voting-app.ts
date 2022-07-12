import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SolanaAnchorVotingApp } from "../target/types/solana_anchor_voting_app";
import { expect } from "chai";
import { BN } from "bn.js";

// NOTE Here's another good example of a test: https://github.com/yourarj/anchor-pda-account-creation-issue/blob/main/tests/anchor-pda-account-creation-issue.ts

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
  console.log("Provider Wallet:", provider.wallet.publicKey.toBase58());

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

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      voteAccountPDA.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .initialize()
      .accounts({
        // Q: I believe the order of accounts need to be consistent
        // Doesn't seem to make any difference so far...
        // A: In lib.rs > Initialize struct, if I put user before vote_account
        // it seems to work, even if order isn't consistent here in test.
        // NOTE It may not be the order, but something up with resetting
        // the test-validator before running the tests...
        voteAccount: voteAccountPDA,
        user: provider.wallet.publicKey,
        // Q: Which programId to pass? Is it my program's or the systemProgram's?
        // NOTE I BELIEVE it should be the SystemProgram's based on this SO thread AND
        // the fact that when I use my program's ID, the error shows it should be 111111...
        // A: I don't think I need to provide the SystemProgramID,
        // since it's a PDA, AND since it doesn't seem needed at all (see below)
        // NOTE https://stackoverflow.com/questions/70675404/cross-program-invocation-with-unauthorized-signer-or-writable-account
        // Q: Do I even need to pass systemProgram? The Anchor PDA tutorial doesn't...
        // A: I didn't need it when just running 'anchor test' (w/o test-validator)
        // systemProgram: program.programId, // ERROR CPI
        // systemProgram: anchor.web3.SystemProgram.programId, // ERROR CPI
      })
      .rpc();
    console.log("Your transaction signature: ", tx);

    // OLD/ORIGINAL: await program.rpc.initialize(new anchor.BN(voteAccountBump), { accounts: {
    //     user: provider.wallet.publicKey,
    //     voteAccount: voteAccount,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //   },
    // });

    // 3. After the transaction returns, we can fetch the state of the vote account
    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccountPDA
    );
    // console.log("currentVoteAccountState: ", currentVoteAccountState);

    // 4. Verify the vote account has set up correctly
    // https://book.anchor-lang.com/anchor_references/javascript_anchor_types_reference.html
    // OLD:
    // assert.equal(0, currentVoteAccountState.crunchy.toNumber());
    // assert.equal(0, currentVoteAccountState.smooth.toNumber());
    // NEW:
    expect(currentVoteAccountState.crunchy.toNumber()).to.equal(0);
    // expect(currentVoteAccountState.crunchy).to.equal(new anchor.BN(0));
    expect(currentVoteAccountState.smooth.toNumber()).to.equal(0);
    // expect(currentVoteAccountState.bump).to.equal(voteAccountBump);
  });

  it("Votes correctly for crunchy", async () => {
    const [voteAccountPDA, voteAccountBump] =
      await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("vote-account"),
          provider.wallet.publicKey.toBuffer(),
        ],
        program.programId
      );

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      voteAccountPDA.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .voteCrunchy()
      .accounts({
        voteAccount: voteAccountPDA,
        user: provider.wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature: ", tx);

    // 3. After the transaction returns, we can fetch the state of the vote account
    let currentVoteAccountState = await program.account.votingState.fetch(
      voteAccountPDA
    );
    // console.log("currentVoteAccountState: ", currentVoteAccountState);

    // 4. Verify the crunchy vote incremented
    expect(currentVoteAccountState.crunchy.toNumber()).to.equal(1);
    // expect(currentVoteAccountState.smooth.toNumber()).to.equal(0);
  });

  // it("Votes correctly for smooth", async () => {
  //   const [voteAccountPDA, _] = await PublicKey.findProgramAddress(
  //     [
  //       anchor.utils.bytes.utf8.encode("vote-account"),
  //       provider.wallet.publicKey.toBuffer(),
  //     ],
  //     program.programId
  //   );
  //   console.log(voteAccountPDA.toBase58());

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .voteSmooth()
  //     .accounts({
  //       voteAccount: voteAccountPDA,
  //     })
  //     .rpc();
  //   console.log("Your transaction signature: ", tx);

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.votingState.fetch(
  //     voteAccountPDA
  //   );
  //   console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the smooth vote incremented
  //   expect(currentVoteAccountState.smooth.toNumber()).to.equal(1);
  //   expect(currentVoteAccountState.crunchy.toNumber()).to.equal(0);
  // });
});
