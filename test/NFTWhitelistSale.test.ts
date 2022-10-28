import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import MerkleTree from "merkletreejs";
import { TokenMetadata } from "./constants";

describe("NFT sale with merkle proof whitelist", () => {
  async function deployNFTSaleContract() {
    const [deployer, user1, user2] = await ethers.getSigners();
    const whitelist = [user1.address, user2.address];

    const leaves = whitelist.map((x) => ethers.utils.keccak256(x));
    const tree = new MerkleTree(leaves, ethers.utils.keccak256);
    const merkleRoot = tree.getRoot();

    const Token = await ethers.getContractFactory("NFTWithSale");
    const token = await Token.deploy(
      TokenMetadata.name,
      TokenMetadata.symbol,
      TokenMetadata.price,
      merkleRoot
    );

    return { token, tree, deployer, user1, user2 };
  }

  it("get token data", async () => {
    const { token, deployer, user1 } = await loadFixture(deployNFTSaleContract);

    expect(await token.name()).to.equal(TokenMetadata.name);
    expect(await token.symbol()).to.equal(TokenMetadata.symbol);
  });

  it("mint to whitelist", async () => {
    const { token, tree, deployer, user1 } = await loadFixture(
      deployNFTSaleContract
    );

    const tokenId = 1;

    const tx = token
      .connect(user1)
      .mint(
        tree.getHexProof(ethers.utils.keccak256(user1.address)),
        user1.address,
        tokenId,
        {
          value: TokenMetadata.price,
        }
      );

    await expect(tx).to.changeEtherBalance(token, TokenMetadata.price);
    await expect(tx)
      .to.emit(token, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, tokenId);
    expect(await token.ownerOf(tokenId)).to.equal(user1.address);
  });

  it("mint to who is not whitelist", async () => {
    const [deployre, user1, user2, user3, user4, user5] =
      await ethers.getSigners();
    const { token, tree } = await loadFixture(deployNFTSaleContract);

    const tokenId = 1;

    const tx = token
      .connect(user2)
      .mint(
        tree.getHexProof(ethers.utils.keccak256(user3.address)),
        user3.address,
        tokenId,
        {
          value: TokenMetadata.price,
        }
      );

    await expect(tx).to.be.revertedWith("Sale : User is not whitelist");
  });
});
