import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MockERC721, NFTTrader } from '../typechain-types';

describe("NFTTrader", function () {
	let nftTrader: NFTTrader,
		owner: SignerWithAddress,
		signer1: SignerWithAddress,
		signer2: SignerWithAddress,
		userAddress1: string,
		userAddress2: string,
		token1: MockERC721,
		token2: MockERC721,
		nftAddress1: string,
		nftAddress2: string;

	beforeEach(async function () {
		[owner, signer1, signer2] = await ethers.getSigners();

		userAddress1 = await signer1.getAddress();
		userAddress2 = await signer2.getAddress();

		nftTrader = await ethers.deployContract("NFTTrader", [ethers.ZeroAddress]);

		token1 = await ethers.deployContract("MockERC721", ['test1', 'TST1']);
		token2 = await ethers.deployContract("MockERC721", ['test2', 'TST2']);

		nftAddress1 = await token1.getAddress();
		nftAddress2 = await token2.getAddress();

		await token1.mint(userAddress1, 1);
		await token2.mint(userAddress2, 2);

		await nftTrader.addApprovedContract(nftAddress1);
		await nftTrader.addApprovedContract(nftAddress2);
	});

	describe("general", function () {
		it("Should revert when contract is paused", async function () {
			await nftTrader.pause();
			await expect(nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2))
				.to.be.revertedWith("Pausable: paused");
		});
	});

	describe("proposeTrade", function () {
		it("Should allow a user to propose a trade", async function () {
			// Propose a trade
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);

			// Check that the trade was created
			const trade = await nftTrader.trades(0);
			expect(trade.proposer).to.equal(userAddress1);
			expect(trade.token1).to.equal(nftAddress1);
			expect(trade.token2).to.equal(nftAddress2);
			expect(trade.tokenId1).to.equal(1);
			expect(trade.tokenId2).to.equal(2);
			expect(trade.status).to.equal(0); // 0 is the enum value for Proposed
		});

		it("Should allow a user to propose a trade with different token from same contract", async function () {
			// Propose a trade
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress1, 1, 2);

			// Check that the trade was created
			const trade = await nftTrader.trades(0);
			expect(trade.proposer).to.equal(userAddress1);
			expect(trade.token1).to.equal(nftAddress1);
			expect(trade.token2).to.equal(nftAddress1);
			expect(trade.tokenId1).to.equal(1);
			expect(trade.tokenId2).to.equal(2);
			expect(trade.status).to.equal(0); // 0 is the enum value for Proposed
		});

		it("Should allow a user to propose a trade with same token ID from different contracts", async function () {
			// Propose a trade
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 1);

			// Check that the trade was created
			const trade = await nftTrader.trades(0);
			expect(trade.proposer).to.equal(userAddress1);
			expect(trade.token1).to.equal(nftAddress1);
			expect(trade.token2).to.equal(nftAddress2);
			expect(trade.tokenId1).to.equal(1);
			expect(trade.tokenId2).to.equal(1);
			expect(trade.status).to.equal(0); // 0 is the enum value for Proposed
		});

		it("Should not allow to propose a trade with non-approved contract", async function () {
			const token3 = await ethers.deployContract("MockERC721", ['test3', 'TST3']);
			await token3.mint(userAddress1, 3);
			await expect(
				nftTrader.connect(signer1).proposeTrade(await token3.getAddress(), nftAddress2, 3, 2)
			).to.be.revertedWith("Only approved NFT contracts allowed.");
		});

		it("Should revert when proposing a trade with zero address", async function () {
			await expect(nftTrader.connect(signer1).proposeTrade(ethers.ZeroAddress, nftAddress2, 1, 2))
				.to.be.revertedWith("Address must not be zero.");
		});

		it("Should revert when proposing a trade with the same token and ID", async function () {
			await expect(nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress1, 1, 1))
				.to.be.revertedWith("If trading tokens from the same contract, token IDs must be different.");
		});

		it("Should revert when proposing a trade with NFT already in active trade", async function () {
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await expect(nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2))
				.to.be.revertedWith("NFT 1 is already involved in an active trade.");
		});
	});

	describe("acceptTrade", function () {
		it("Should allow the second user to accept a trade", async function () {
			// User 1 approves the NFTTrader contract to move token 1
			await token1.connect(signer1).approve(await nftTrader.getAddress(), 1);

			// User 2 approves the NFTTrader contract to move token 2
			await token2.connect(signer2).approve(await nftTrader.getAddress(), 2);

			// User 1 proposes a trade
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);

			// User 2 accepts the trade
			await nftTrader.connect(signer2).acceptTrade(0);

			expect(await token1.ownerOf(1)).to.equal(userAddress2);
			expect(await token2.ownerOf(2)).to.equal(userAddress1);
			const trade = await nftTrader.trades(0);
			expect(trade.status).to.equal(1); // 1 is the enum value for Completed
		});

		it("Should revert when accepting a non-proposed trade", async function () {
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await nftTrader.connect(signer1).cancelTrade(0);
			await expect(nftTrader.connect(signer2).acceptTrade(0))
				.to.be.revertedWith("Trade is not in Proposed state.");
		});

		it("Should revert when accepting the trade by non-holder", async function () {
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await expect(nftTrader.connect(owner).acceptTrade(0))
				.to.be.revertedWith("Only a current NFT holder can accept the trade.");
		});

		it("Should revert when accepting the trade without approval", async function () {
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await expect(nftTrader.connect(signer2).acceptTrade(0))
				.to.be.revertedWith("NFT 1 not approved for trade by holder.");
		});
	});

	describe("cancelTrade", function () {
		it("Should allow a user to cancel a trade", async function () {
			// User 1 proposes a trade
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);

			// User 1 cancels the trade
			await nftTrader.connect(signer1).cancelTrade(0);
			const trade = await nftTrader.trades(0);
			expect(trade.status).to.equal(2); // 2 is the enum value for Cancelled
		});

		it("Should not allow a user to cancel a trade that has been executed", async function () {
			await token1.connect(signer1).approve(await nftTrader.getAddress(), 1);
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await token2.connect(signer2).approve(await nftTrader.getAddress(), 2);
			await nftTrader.connect(signer2).acceptTrade(0);
			await expect(nftTrader.connect(signer1).cancelTrade(0)).to.be.revertedWith("Trade is not in Proposed state.");
		});

		it("Should revert when cancelling by non-trader", async function () {
			await nftTrader.connect(signer1).proposeTrade(nftAddress1, nftAddress2, 1, 2);
			await expect(nftTrader.connect(owner).cancelTrade(0))
				.to.be.revertedWith("Only a trader involved can cancel the trade.");
		});
	});
});
