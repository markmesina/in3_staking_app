const { assert } = require('chai');

const DappToken = artifacts.require('DappToken');
const DaiToken = artifacts.require('DaiToken');
const TokenFarm = artifacts.require('TokenFarm');

require('chai')
  .use(require('chai-as-promised'))
  .should();

// converter function
function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}
contract('TokenFarm', ([owner, investor]) => {
  //set up variables
  let daiToken, dappToken, tokenFarm

  before(async () => {
    //load contracts
    daiToken = await DaiToken.new()
    dappToken = await DappToken.new()
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

    //transfer all DApp tokens to farm (1 million)
    await dappToken.transfer(tokenFarm.address, tokens('1000000'));

    // send tokens to investor
    await daiToken.transfer(investor, tokens('100'), { from: owner})
  })


  //test code
  describe('Mock DAI deployement', async () => {
    it('has a name', async () => {
      const name = await daiToken.name()
      assert.equal (name, 'Mock DAI Token')
    });
  });

  describe('Dapp Token deployement', async () => {
    it('has a name', async () => {
      const name = await dappToken.name()
      assert.equal (name, 'DApp Token')
    });
  });

  describe('Token Farm deployement', async () => {
    it('has a name', async () => {
      const name = await tokenFarm.name()
      assert.equal (name, 'Dapp Token Farm')
    });

    //confirm account has balance test
    it('contract has tokens', async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address)
      assert.equal(balance.toString(), tokens('1000000'))
    });
  });

  describe('Farming tokens', async () => {

    it('rewards investors for staking mDai tokens', async () => {
      let result;

      //check investor balance before staking
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking');

      // stake mDai Token -- approve and stake
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor});
      await tokenFarm.stakeTokens(tokens('100'), {from: investor});

      // check staking result
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking');

      // balance at token farm is correct, balance moved from wallet to app
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI balance is correct after staking');

      //confirm staking balance after staking
      result = await tokenFarm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('100'), 'investor staking balance is correct after staking');

      //confirm if investor is staking
      result = await tokenFarm.isStaking(investor);
      assert.equal(result.toString(), 'true', 'investor staking status is correct after staking');

      // confirm issue token
      await tokenFarm.issueTokens({ from: owner});
      
      //check balances after issuance
      result = await dappToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor DApp token wallet balance is correct after issuing token');

      //ensure owner is the only one who can issue token
      await tokenFarm.issueTokens({from: investor}).should.be.rejected;

      //unstake tokens
      await tokenFarm.unstakeTokens({ from: investor });

      //check results after unstaking
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock DAI balance is correct after unstaking tokens from app');

      //tokenFarm address mDai balance is 0
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking');

      //investor staking balance is 0
      result = await tokenFarm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking');

      // check investor staking status
      result = await tokenFarm.isStaking(investor)
      assert.equal(result.toString(), 'false', 'investor staking status correct after staking');
    });

  });


});