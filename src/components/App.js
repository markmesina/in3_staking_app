import React, { Component } from 'react'
import Web3 from 'web3'
import IN3Client from 'in3';
import WasmIN3Client from 'in3-wasm';
import Navbar from './Navbar'
import DaiToken from '../abis/DaiToken.json'
import DappToken from '../abis/DappToken.json'
import TokenFarm from '../abis/TokenFarm.json'
import Main from './Main'
import './App.css'

import InterceptAndLog from "./InterceptAndLog.js";

export const useWasm = false;
class App extends Component {


   async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3
    console.log(web3, 'web3')
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    console.log(web3.eth)
    this.setState({ account: accounts[0] })

    const networkId = await web3.eth.net.getId()
    console.log(networkId)

    // load DAI Token
    const daiTokenData = DaiToken.networks[networkId]

    if (daiTokenData) {
      const daiToken = new web3.eth.Contract(DaiToken.abi, daiTokenData.address)

      this.setState({ daiToken })

      let daiTokenBalance = await daiToken.methods
        .balanceOf(this.state.account)
        .call()
        this.setState({ daiTokenBalance: daiTokenBalance.toString() })
      console.log(daiTokenBalance)
    } else {
      window.alert('DaiToken contract not deployed to detected network!')
    }

    // load Dapp Token
    const dappTokenData = DappToken.networks[networkId]

    if (dappTokenData) {
      const dappToken = new web3.eth.Contract(
        DappToken.abi,
        dappTokenData.address,
      )

      this.setState({ dappToken })

      let dappTokenBalance = await dappToken.methods
        .balanceOf(this.state.account)
        .call()
        this.setState({ dappTokenBalance: dappTokenBalance.toString() })
      console.log(dappTokenBalance)
    } else {
      window.alert('DaiToken contract not deployed to detected network!')
    }

    // load Token Farm
    const tokenFarmData = TokenFarm.networks[networkId]
    if (tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(
        TokenFarm.abi,
        tokenFarmData.address,
      )
      this.setState({ tokenFarm })
      let stakingBalance = await tokenFarm.methods
        .stakingBalance(this.state.account)
        .call()
      this.setState({ stakingBalance: stakingBalance.toString() })
    } else {
      window.alert('TokenFarm contract not deployed to detected network')
    }

    this.setState({ loading: false })
  }

  //connect app to blockchain
  async loadWeb3(withVerification) {
      // If withVerification, Incubed Client (IN3) will be used as a provider for Web3.
      if (withVerification) {
        const in3Config = {
          proof: 'standard',  //‘none’ for no verification, ‘standard’ for verifying all important fields, ‘full’ veryfying all fields even if this means a high payload 
          signatureCount: 2,
          requestCount: 3,
          chainId: 'mainnet',
          timeout: 30000,
          replaceLatestBlock: 6
        };
  
        try {
          let client;
          if (!window.web3WithIn3) {
            if (useWasm) {
              WasmIN3Client.setTransport(new InterceptAndLog().in3WasmTransportFunction)
  
              client = new WasmIN3Client(in3Config)
            }
            else {
              client = new IN3Client(in3Config);
            }
  
            // use the IN3Client as Http-Provider
            const web3 = new Web3(client);
            window.web3WithIn3 = web3;
          }
  
          console.log("Using Web3 with IN3 (Incubed Client will be used as a provider for Web3)");
          return(window.web3WithIn3);
        } catch (error) {
          return(error);
        }
      }
      else {
        console.log("Web3 without Incubed Client (IN3) will be used. There will be no way to verify the respose of the remote Node (Ethereum Client). Be sure to connect to a trusted Node");
        // Wait for loading completion to avoid race conditions with web3 injection timing.
        this.useMetamask();
      }
  }
  async useMetamask() {
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable()
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      // Use Mist/MetaMask's provider.
      window.web3 = new Web3(window.web3.currentProvider)
      console.log(window.web3.currentProvider, 'currentprovider')
      console.log("Injected web3 detected.");
    }
    // Fallback to localhost; use dev console port by default...
    else {
      window.alert('Non-Ethereum browser detected. Try MetaMask! :)')
    }
  };

  stakeTokens = (amount) => {
    this.setState({ loading: true })
    this.state.daiToken.methods
      .approve(this.state.tokenFarm._address, amount)
      .send({ from: this.state.account })
      .on('transactionHash', (hash) => {
        this.state.tokenFarm.methods
          .stakeTokens(amount)
          .send({ from: this.state.account })
          .on('transactionHash', (hash) => {
            this.setState({ loading: false })
          })
      })
  }

  unstakeTokens = (amount) => {
    this.setState({ loading: true })
    this.state.tokenFarm.methods
      .unstakeTokens()
      .send({ from: this.state.account })
      .on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      daiToken: {},
      dappToken: {},
      tokenFarm: {},
      daiTokenBalance: '0',
      dappTokenBalance: '0',
      stakingBalance: '0',
      loading: true,
    }
  }

  render() {
    let content
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          {' '}
          Loading...
        </p>
      )
    } else {
      content = (
        <Main
          daiTokenBalance={this.state.daiTokenBalance}
          dappTokenBalance={this.state.dappTokenBalance}
          stakingBalance={this.state.stakingBalance}
          stakeTokens={this.stakeTokens}
          unstakeTokens={this.unstakeTokens}
        />
      )
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 ml-auto mr-auto"
              style={{ maxWidth: '600px' }}
            >
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                </a>

                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }
}

export default App
