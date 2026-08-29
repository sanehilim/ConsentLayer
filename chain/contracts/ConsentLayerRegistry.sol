// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ConsentLayerRegistry
/// @notice Onchain commitment and atomic native-0G settlement for ConsentLayer.
/// @dev This contract is a testnet baseline and must be independently audited before mainnet use.
contract ConsentLayerRegistry {
    string public constant NAME = "ConsentLayer License";
    string public constant VERSION = "1";
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant FREE_LICENSE_TYPEHASH = keccak256("FreeLicense(bytes32 datasetId,bytes32 purpose,uint64 policyVersion,uint64 expiresAt,address requester,uint256 nonce,uint256 deadline)");

    struct Dataset {
        address owner;
        bytes32 metadataHash;
        bytes32 storageRoot;
        uint64 policyVersion;
        uint64 licenseDuration;
        uint96 price;
        bool revoked;
    }

    struct License {
        bytes32 datasetId;
        address requester;
        address owner;
        bytes32 purpose;
        uint64 policyVersion;
        uint64 issuedAt;
        uint64 expiresAt;
        uint96 price;
        bool revoked;
    }

    mapping(bytes32 => Dataset) public datasets;
    mapping(bytes32 => License) public licenses;
    mapping(bytes32 => mapping(address => uint256)) public nonces;
    mapping(bytes32 => bool) public datasetExists;
    mapping(bytes32 => bool) public licenseExists;
    uint256 private locked = 1;

    event DatasetCreated(bytes32 indexed datasetId, address indexed owner, bytes32 metadataHash, bytes32 storageRoot, uint64 policyVersion, uint96 price, uint64 licenseDuration);
    event DatasetUpdated(bytes32 indexed datasetId, bytes32 metadataHash, bytes32 storageRoot, uint64 policyVersion, uint96 price, uint64 licenseDuration);
    event DatasetRevoked(bytes32 indexed datasetId, address indexed owner, uint64 policyVersion);
    event OwnershipTransferred(bytes32 indexed datasetId, address indexed previousOwner, address indexed newOwner);
    event LicenseIssued(bytes32 indexed licenseId, bytes32 indexed datasetId, address indexed requester, bytes32 purpose, uint64 policyVersion, uint96 price, uint64 expiresAt);
    event LicenseRevoked(bytes32 indexed licenseId, address indexed owner);

    modifier onlyDatasetOwner(bytes32 datasetId) {
        require(datasetExists[datasetId], "dataset missing");
        require(datasets[datasetId].owner == msg.sender, "not owner");
        _;
    }

    modifier nonReentrant() {
        require(locked == 1, "reentrant call");
        locked = 2;
        _;
        locked = 1;
    }

    function createDataset(bytes32 datasetId, bytes32 metadataHash, bytes32 storageRoot, uint96 price, uint64 licenseDuration) external {
        require(!datasetExists[datasetId], "dataset exists");
        require(datasetId != bytes32(0), "invalid dataset id");
        require(licenseDuration > 0 && licenseDuration <= 3650 days, "invalid duration");
        datasetExists[datasetId] = true;
        datasets[datasetId] = Dataset(msg.sender, metadataHash, storageRoot, 1, licenseDuration, price, false);
        emit DatasetCreated(datasetId, msg.sender, metadataHash, storageRoot, 1, price, licenseDuration);
    }

    function updateDataset(bytes32 datasetId, bytes32 metadataHash, bytes32 storageRoot, uint96 price, uint64 licenseDuration) external onlyDatasetOwner(datasetId) {
        require(!datasets[datasetId].revoked, "dataset revoked");
        require(licenseDuration > 0 && licenseDuration <= 3650 days, "invalid duration");
        Dataset storage dataset = datasets[datasetId];
        dataset.metadataHash = metadataHash;
        dataset.storageRoot = storageRoot;
        dataset.price = price;
        dataset.licenseDuration = licenseDuration;
        dataset.policyVersion += 1;
        emit DatasetUpdated(datasetId, metadataHash, storageRoot, dataset.policyVersion, price, licenseDuration);
    }

    function revokeDataset(bytes32 datasetId) external onlyDatasetOwner(datasetId) {
        Dataset storage dataset = datasets[datasetId];
        require(!dataset.revoked, "already revoked");
        dataset.revoked = true;
        dataset.policyVersion += 1;
        emit DatasetRevoked(datasetId, msg.sender, dataset.policyVersion);
    }

    function transferDataset(bytes32 datasetId, address newOwner) external onlyDatasetOwner(datasetId) {
        require(newOwner != address(0), "invalid owner");
        address previousOwner = datasets[datasetId].owner;
        datasets[datasetId].owner = newOwner;
        emit OwnershipTransferred(datasetId, previousOwner, newOwner);
    }

    function issuePaidLicense(bytes32 datasetId, bytes32 purpose, address requester) external payable nonReentrant returns (bytes32 licenseId) {
        require(datasetExists[datasetId], "dataset missing");
        Dataset memory dataset = datasets[datasetId];
        require(!dataset.revoked, "dataset revoked");
        require(msg.value == dataset.price && dataset.price > 0, "incorrect payment");
        require(requester == msg.sender, "requester mismatch");
        uint64 expiresAt = uint64(block.timestamp) + dataset.licenseDuration;
        uint256 nonce = nonces[datasetId][requester]++;
        licenseId = keccak256(abi.encode(datasetId, purpose, dataset.policyVersion, requester, nonce, block.number));
        require(!licenseExists[licenseId], "license exists");
        licenses[licenseId] = License(datasetId, requester, dataset.owner, purpose, dataset.policyVersion, uint64(block.timestamp), expiresAt, uint96(msg.value), false);
        licenseExists[licenseId] = true;
        (bool paid, ) = payable(dataset.owner).call{value: msg.value}("");
        require(paid, "payment failed");
        emit LicenseIssued(licenseId, datasetId, requester, purpose, dataset.policyVersion, uint96(msg.value), expiresAt);
    }

    function issueFreeLicense(bytes32 datasetId, bytes32 purpose, address requester, uint64 expiresAt, uint256 nonce, uint256 deadline, bytes calldata ownerSignature) external nonReentrant returns (bytes32 licenseId) {
        require(datasetExists[datasetId], "dataset missing");
        require(requester != address(0), "invalid requester");
        Dataset memory dataset = datasets[datasetId];
        require(!dataset.revoked, "dataset revoked");
        require(block.timestamp <= deadline && expiresAt > block.timestamp, "expired request");
        require(nonces[datasetId][requester] == nonce, "invalid nonce");
        bytes32 structHash = keccak256(abi.encode(FREE_LICENSE_TYPEHASH, datasetId, purpose, dataset.policyVersion, expiresAt, requester, nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        require(_recover(digest, ownerSignature) == dataset.owner, "invalid owner signature");
        nonces[datasetId][requester] = nonce + 1;
        licenseId = keccak256(abi.encode(datasetId, purpose, dataset.policyVersion, requester, nonce, block.number));
        require(!licenseExists[licenseId], "license exists");
        licenses[licenseId] = License(datasetId, requester, dataset.owner, purpose, dataset.policyVersion, uint64(block.timestamp), expiresAt, 0, false);
        licenseExists[licenseId] = true;
        emit LicenseIssued(licenseId, datasetId, requester, purpose, dataset.policyVersion, 0, expiresAt);
    }

    function revokeLicense(bytes32 licenseId) external {
        require(licenseExists[licenseId], "license missing");
        License storage license = licenses[licenseId];
        require(msg.sender == license.owner, "not owner");
        license.revoked = true;
        emit LicenseRevoked(licenseId, msg.sender);
    }

    function domainSeparator() external view returns (bytes32) { return _domainSeparator(); }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(EIP712_DOMAIN_TYPEHASH, keccak256(bytes(NAME)), keccak256(bytes(VERSION)), block.chainid, address(this)));
    }

    function _recover(bytes32 digest, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "invalid signature length");
        bytes32 r; bytes32 s; uint8 v;
        assembly { r := mload(add(signature, 32)) s := mload(add(signature, 64)) v := byte(0, mload(add(signature, 96))) }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "invalid signature v");
        // Reject malleable signatures (EIP-2) and the zero address recovery.
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "high-s signature");
        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0), "invalid signature");
        return recovered;
    }
}
