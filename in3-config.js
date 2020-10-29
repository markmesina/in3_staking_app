require('babel-register');
require('babel-polyfill');

module.exports = {
    "evmVersion": "byzantium",
    "libraries": {},
    "optimizer": {
      "enabled": true,
      "runs": 200
    },
    "remappings": [],
    "outputSelection": {
      "*": {
        "*": [
          "evm.bytecode",
          "evm.deployedBytecode",
          "abi"
        ]
      }
    }
  }