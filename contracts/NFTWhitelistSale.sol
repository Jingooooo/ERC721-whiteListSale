// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (utils/Strings.sol)

pragma solidity ^0.8.0;

import "./IERC721.sol";
import "./ERC721.sol";
import "./utils/MerkleProof.sol";

contract NFTWithSale is ERC721 {
    uint256 private _price;
    bytes32 private _merkleRoot;

    constructor(
        string memory name,
        string memory symbol,
        uint256 price,
        bytes32 merkleRoot
    ) ERC721(name, symbol) {
        _price = price;
        _merkleRoot = merkleRoot;
    }

    function mint(
        bytes32[] memory proof,
        address to,
        uint256 tokenId
    ) public payable {
        require(
            MerkleProof.verify(
                proof,
                _merkleRoot,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Sale : User is not whitelist"
        );
        require(msg.value >= _price, "Sale : Ether not enough");

        _mint(to, tokenId);
    }
}
