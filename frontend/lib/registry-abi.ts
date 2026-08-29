export const REGISTRY_ABI = [
  "function createDataset(bytes32 datasetId, bytes32 metadataHash, bytes32 storageRoot, uint96 price, uint64 licenseDuration)",
  "function updateDataset(bytes32 datasetId, bytes32 metadataHash, bytes32 storageRoot, uint96 price, uint64 licenseDuration)",
  "function revokeDataset(bytes32 datasetId)",
  "function issuePaidLicense(bytes32 datasetId, bytes32 purpose, address requester) payable returns (bytes32 licenseId)",
  "function issueFreeLicense(bytes32 datasetId, bytes32 purpose, address requester, uint64 expiresAt, uint256 nonce, uint256 deadline, bytes ownerSignature) returns (bytes32 licenseId)",
  "function datasets(bytes32) view returns (address owner, bytes32 metadataHash, bytes32 storageRoot, uint64 policyVersion, uint64 licenseDuration, uint96 price, bool revoked)",
  "function nonces(bytes32,address) view returns (uint256)",
  "function domainSeparator() view returns (bytes32)",
  "event DatasetCreated(bytes32 indexed datasetId, address indexed owner, bytes32 metadataHash, bytes32 storageRoot, uint64 policyVersion, uint96 price, uint64 licenseDuration)",
  "event DatasetUpdated(bytes32 indexed datasetId, bytes32 metadataHash, bytes32 storageRoot, uint64 policyVersion, uint96 price, uint64 licenseDuration)",
  "event DatasetRevoked(bytes32 indexed datasetId, address indexed owner, uint64 policyVersion)",
  "event LicenseIssued(bytes32 indexed licenseId, bytes32 indexed datasetId, address indexed requester, bytes32 purpose, uint64 policyVersion, uint96 price, uint64 expiresAt)",
]
