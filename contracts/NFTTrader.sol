// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFTTradeLogic.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";


contract NFTTrader is ERC2771Context, NFTTradeLogic {
    
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function _msgSender()
        internal
        view
        override(Context, ERC2771Context)
        returns (address)
    {
        return super._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        return super._msgData();
    }    
}