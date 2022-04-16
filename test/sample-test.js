const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const {
  constants, // Common constants, like the zero address and largest integers
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const { solidity } = require("ethereum-waffle");
use(solidity);

// https://www.chaijs.com/guide/styles/
// https://ethereum-waffle.readthedocs.io/en/latest/matchers.html

describe("Volcano Coin", () => {
  let volcanoContract;
  let owner, addr1, addr2, addr3;

  beforeEach(async () => {
    const Volcano = await ethers.getContractFactory("VolcanoCoin");
    volcanoContract = await Volcano.deploy();
    await volcanoContract.deployed();

    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  it("has a name", async () => {
    let contractName = await volcanoContract.name();
    expect(contractName).to.equal("Volcano Coin");
  });

  it("reverts when transferring tokens to the zero address", async () => {
    await expectRevert(
      volcanoContract.transfer(constants.ZERO_ADDRESS, 10),
      "ERC20: transfer to the zero address"
    );
  });

  //homework
  it("has a symbol", async () => {
    let symbol = await volcanoContract.symbol();
    expect(symbol).to.equal("VLC");
  });

  it("has 18 decimals", async () => {
    expect(await volcanoContract.decimals()).to.equal(18);
  });

  it("assigns initial balance", async () => {
    let ownerBalance = await volcanoContract.balanceOf(owner.address);
    expect(await volcanoContract.totalSupply()).to.equal(ownerBalance);
  });

  it("increases allowance for address1", async () => {
    let allowanceBefore = await volcanoContract.allowance(owner.address, addr1.address);
    await volcanoContract.approve(addr1.address, 10);
    expect(await volcanoContract.allowance(owner.address, addr1.address)).to.equal(allowanceBefore + 10);
  });

  it("decreases allowance for address1", async () => {
    // Increase
    let allowanceBefore = await volcanoContract.allowance(owner.address, addr1.address);
    await volcanoContract.approve(addr1.address, 10);
    expect(await volcanoContract.allowance(owner.address, addr1.address)).to.equal(allowanceBefore + 10);

    // Decrease
    await volcanoContract.approve(addr1.address, 0);
    await volcanoContract.approve(addr1.address, 5);
    expect(await volcanoContract.allowance(owner.address, addr1.address)).to.equal(5);
  });

  it("emits an event when increasing allowance", async () => { 
    await expect(volcanoContract.approve(addr1.address, 10))
    .to.emit(volcanoContract, 'Approval') // Second param is the Event name
    .withArgs(owner.address, addr1.address, 10);
  });

  it("reverts decreaseAllowance when trying decrease below 0", async () => { 
    await expectRevert(volcanoContract.approve(addr1.address, -10), "out-of-bounds (argument=\"amount\", value=-10, code=INVALID_ARGUMENT, version=abi/5.6.1)");
  });

  it("updates balances on successful transfer from owner to addr1", async () => { 
    let balanceBefore = await volcanoContract.balanceOf(owner.address);
    await volcanoContract.transfer(addr1.address, 100);
    expect(await volcanoContract.balanceOf(owner.address)).to.equal(balanceBefore - 100);
  });

  it("reverts transfer when sender does not have enough balance", async () => {
    await volcanoContract.transfer(addr1.address, 100);
    await expectRevert(volcanoContract.connect(addr1).transfer(addr2.address, 150), 'ERC20: transfer amount exceeds balance');
   });

  it("reverts transferFrom addr1 to addr2 called by the owner without setting allowance", async () => { 
    await expectRevert(volcanoContract.transferFrom(addr1.address, addr2.address, 10), "ERC20: insufficient allowance");
  });

  it("updates balances after transferFrom addr1 to addr2 called by the owner", async () => { 
    await volcanoContract.transfer(addr1.address, 20);
    // addr1 must approve owner in order for owner to move tokens from addr1 to addr2
    await volcanoContract.connect(addr1).approve(owner.address, 10);
    await volcanoContract.transferFrom(addr1.address, addr2.address, 10); // owner is trying to transfer tokens from addr1 to addr2 -> this must be approved by addr1
    expect(await volcanoContract.balanceOf(addr1.address)).to.equal(10);
  });

});
