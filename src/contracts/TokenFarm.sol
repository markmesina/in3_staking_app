pragma solidity ^0.5.0;
import './DappToken.sol';
import './DaiToken.sol';

contract TokenFarm {

  string public name = 'Dapp Token Farm';
  //assign as state variables
  address public owner; //define owner
  DappToken public dappToken; //deploy DAPP - grab address
  DaiToken public daiToken; //deploy DAI - grab address
   
  address[] public stakers; //array off people who has stake on the app

  mapping(address => uint) public stakingBalance;
  mapping(address => bool) public hasStaked; //keeps track of people who staked
  mapping(address => bool) public isStaking; //keeps track of people who staked

  constructor(DappToken _dappToken, DaiToken _daiToken) public {
    dappToken = _dappToken; //pass down smart contract
    daiToken = _daiToken;
    owner = msg.sender; // assign owner
  }

  // stake tokens (investor deposits)
  function stakeTokens(uint _amount) public {
    //require stake amt greater than 0
    require(_amount > 0, 'stake cannot be 0');

    // transfer DAI through this contract into Token Farm
    daiToken.transferFrom(msg.sender, address(this), _amount);

    //update staking balance
    stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

    // add user to stakers array if they haven't
    if(!hasStaked[msg.sender]) {
      stakers.push(msg.sender);
    }

    //update staking status
    isStaking[msg.sender] = true;
    hasStaked[msg.sender] = true;
  }

  //issuing tokens (interest)
  function issueTokens() public {
    require(msg.sender == owner, 'token issuer must be the owner');

    // loop through all people who have staked and issue token
    for ( uint i = 0; i < stakers.length; i++ ) {
      address recipient = stakers[i];
      uint balance = stakingBalance[recipient]; //fetch balance

      if (balance > 0) {
        dappToken.transfer(recipient, balance); // 1 to 1 trade. 1mDai = 1DappToken
      }
    }
  }

  //unstaking tokens (withdraw)
  function unstakeTokens() public {
    //fetch balance
    uint balance = stakingBalance[msg.sender];

    // require amt greater than 0
    require(balance > 0, 'staking balance cannot be 0');

    // transfer mDAi token back to investor
    daiToken.transfer(msg.sender, balance);

    //reset staking balance
    stakingBalance[msg.sender] = 0;

    //update staking status
    isStaking[msg.sender] = false;

  }
}