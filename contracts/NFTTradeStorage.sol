// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

contract NFTTradeStorage is Ownable, ReentrancyGuard, Pausable {
    enum TradeStatus {
        Proposed,
        Completed,
        Cancelled
    }

    struct Trade {
        address proposer;
        IERC721Enumerable tokenOffered;
        IERC721Enumerable tokenRequested;
        uint256 offeredTokenId;
        uint256 requestedTokenId;
        TradeStatus status;
    }

    /**
     * @dev Counter used to assign unique IDs to each trade proposal.
     * It is incremented every time a new trade is proposed.
     */
    uint256 public tradeCounter = 0;

    /**
     * @dev Mapping that stores the details of each trade by trade ID.
     * Trade details include traders' addresses, tokens, token IDs, deposit status, and trade status.
     */
    mapping(uint256 => Trade) public trades;

    /**
     * @dev Mapping that stores whether an NFT is part of an active trade.
     * NFT contract address => token ID => !!active.
     */
    mapping(address => mapping(uint256 => bool)) public nftInActiveTrade;

    /**
     * @dev Mapping that associates an address (user) with a list of trade IDs they are involved in.
     * This helps in tracking all the trades for a specific user.
     */
    mapping(address => uint256[]) public userTrades;

    /**
     * @dev Mapping that stores the approval status of NFT contracts.
     * Only NFTs from approved contracts can be traded.
     * The contract address is mapped to a boolean indicating whether it is approved.
     */
    mapping(address => bool) public approvedContracts;
}
