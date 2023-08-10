// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFTTradeStorage.sol";

contract NFTTradeManagement is NFTTradeStorage {
    /**
     * @notice Allows the contract owner to approve a new NFT contract for use in trades.
     * @dev This function can only be called by the contract owner.
     * @param _contract The address of the NFT contract to approve.
     */
    function addApprovedContract(
        address _contract
    ) public onlyOwner whenNotPaused {
        approvedContracts[_contract] = true;
    }

    /**
     * @notice Allows the contract owner to pause the contract.
     * @dev This function can only be called by the contract owner.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Allows the contract owner to unpause the contract.
     * @dev This function can only be called by the contract owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}
