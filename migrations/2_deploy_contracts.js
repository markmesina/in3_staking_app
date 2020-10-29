const DappToken = artifacts.require('DappToken');
const DaiToken = artifacts.require('DaiToken');
const TokenFarm = artifacts.require("TokenFarm");

module.exports = async function(deployer, network, accounts) {
  //deploy mock Dai token
  await deployer.deploy(DaiToken);
  const daiToken = await DaiToken.deployed();

  //deploy mock Dapp token
  await deployer.deploy(DappToken);
  const dappToken = await DappToken.deployed();
  
  //deploy token farm
  await deployer.deploy(TokenFarm, dappToken.address, daiToken.address);
  const tokenFarm = await TokenFarm.deployed();

  // transfer all tokens to TokenFarm (1Million)
    await dappToken.transfer(tokenFarm.address,'1000000000000000000000000');

  // transfer 100 mock dai tokens to investor
    await daiToken.transfer(accounts[1], '100000000000000000000');
};

