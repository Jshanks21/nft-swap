// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFTTradeStorage.sol";
import "./NFTTradeManagement.sol";
import "./NFTTradeERC721Receiver.sol";

contract NFTTradeLogic is
    NFTTradeStorage,
    NFTTradeManagement,
    NFTTradeERC721Receiver
{
    event TradeProposed(uint256 tradeId, address proposer);
    event TradeCancelled(uint256 tradeId, address cancelledBy);
    event TradeAccepted(uint256 tradeId, address trader2);

    modifier notZeroAddress(address _address) {
        require(_address != address(0), "Address must not be zero.");
        _;
    }

    /**
     * @dev Proposes a trade between the message sender and another trader.
     * The function checks that both tokens are from approved contracts, they're not the same token, and neither token is in an existing trade.
     * The last checks are to prevent misuse or spamming many trades with a single token.
     * A new Trade struct is created and stored in the 'trades' mapping.
     * The function emits a TradeProposed event and increments the trade counter.
     * @param _token1 The NFT contract of the token being offered by the message sender.
     * @param _token2 The NFT contract of the token being requested from the other trader.
     * @param _tokenId1 The token ID of the token being offered by the message sender.
     * @param _tokenId2 The token ID of the token being requested from the other trader.
     * @return tradeId The ID of the newly proposed trade.
     */
    function proposeTrade(
        IERC721Enumerable _token1,
        IERC721Enumerable _token2,
        uint256 _tokenId1,
        uint256 _tokenId2
    )
        public
        whenNotPaused
        notZeroAddress(address(_token1))
        notZeroAddress(address(_token2))
        returns (uint256 tradeId)
    {
        // Ensures that if trading tokens from the same contract, token IDs must be different.
        // If tokens are from different contracts, IDs don't matter. This prevents trading the same NFT with itself.
        require(
            address(_token1) != address(_token2) || _tokenId1 != _tokenId2,
            "If trading tokens from the same contract, token IDs must be different."
        );
        require(
            approvedContracts[address(_token1)] &&
                approvedContracts[address(_token2)],
            "Only approved NFT contracts allowed."
        );
        require(
            !nftInActiveTrade[address(_token1)][_tokenId1],
            "NFT 1 is already involved in an active trade."
        );
        require(
            !nftInActiveTrade[address(_token2)][_tokenId2],
            "NFT 2 is already involved in an active trade."
        );

        Trade memory newTrade = Trade({
            proposer: _msgSender(),
            token1: _token1,
            token2: _token2,
            tokenId1: _tokenId1,
            tokenId2: _tokenId2,
            status: TradeStatus.Proposed
        });

        trades[tradeCounter] = newTrade;

        userTrades[_msgSender()].push(tradeCounter);

        nftInActiveTrade[address(_token1)][_tokenId1] = true;
        nftInActiveTrade[address(_token2)][_tokenId2] = true;

        emit TradeProposed(tradeCounter, _msgSender());
        tradeCounter++;

        return tradeCounter - 1;
    }

    /**
     * @notice Allows the second trader to accept a proposed trade, executing the trade and transferring the NFTs.
     * @dev This function requires that the caller is the second trader in the trade, the trade is in the Proposed state,
     *      and both traders have deposited their NFTs into the contract.
     * @param _tradeId The ID of the trade to accept.
     */
    function acceptTrade(uint256 _tradeId) public nonReentrant whenNotPaused {
        Trade storage trade = trades[_tradeId];

        require(
            _msgSender() == IERC721(trade.token2).ownerOf(trade.tokenId2),
            "Only a current NFT holder can accept the trade."
        );
        require(
            trade.status == TradeStatus.Proposed,
            "Trade is not in Proposed state."
        );
        require(
            IERC721(trade.token1).getApproved(trade.tokenId1) == address(this),
            "NFT 1 not approved for trade by holder."
        );
        require(
            IERC721(trade.token2).getApproved(trade.tokenId2) == address(this),
            "NFT 2 not approved for trade by holder."
        );

        if (trade.proposer != IERC721(trade.token1).ownerOf(trade.tokenId1)) {
            trade.status = TradeStatus.Cancelled;
            emit TradeCancelled(_tradeId, trade.proposer);
            revert("Proposer no longer holds NFT to trade. Trade Cancelled.");
        }

        IERC721(trade.token1).safeTransferFrom(
            trade.proposer,
            _msgSender(),
            trade.tokenId1
        );
        IERC721(trade.token2).safeTransferFrom(
            _msgSender(),
            trade.proposer,
            trade.tokenId2
        );

        trade.status = TradeStatus.Completed;

        nftInActiveTrade[address(trade.token1)][trade.tokenId1] = false;
        nftInActiveTrade[address(trade.token2)][trade.tokenId2] = false;

        emit TradeAccepted(_tradeId, _msgSender());
    }

    /**
     * @notice Allows either trader to cancel a proposed trade, returning the deposited NFTs to the traders.
     * @dev This function requires that the caller is one of the traders in the trade and the trade is in the Proposed state.
     * @param _tradeId The ID of the trade to cancel.
     */
    function cancelTrade(uint256 _tradeId) public nonReentrant whenNotPaused {
        Trade storage trade = trades[_tradeId];

        require(
            _msgSender() == trade.proposer ||
                _msgSender() == IERC721(trade.token2).ownerOf(trade.tokenId2),
            "Only a trader involved can cancel the trade."
        );
        require(
            trade.status == TradeStatus.Proposed,
            "Trade is not in Proposed state."
        );

        trade.status = TradeStatus.Cancelled;

        nftInActiveTrade[address(trade.token1)][trade.tokenId1] = false;
        nftInActiveTrade[address(trade.token2)][trade.tokenId2] = false;

        emit TradeCancelled(_tradeId, _msgSender());
    }
}
