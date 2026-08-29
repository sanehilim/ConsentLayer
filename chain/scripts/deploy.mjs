import { readFile, writeFile } from "node:fs/promises"
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers"

const rpcUrl = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai"
const privateKey = process.env.OG_DEPLOYER_PRIVATE_KEY
if (!privateKey) throw new Error("OG_DEPLOYER_PRIVATE_KEY is required and must never be committed")
await import("./compile.mjs")
const artifact = JSON.parse(await readFile(new URL("../artifacts/ConsentLayerRegistry.json", import.meta.url), "utf8"))
const provider = new JsonRpcProvider(rpcUrl)
const wallet = new Wallet(privateKey, provider)
const network = await provider.getNetwork()
if (network.chainId !== 16602n) throw new Error(`Refusing to deploy: expected Galileo 16602, got ${network.chainId}`)
console.log(`Deploying from ${wallet.address} on chain ${network.chainId}`)
const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet)
const contract = await factory.deploy()
const deployment = await contract.deploymentTransaction().wait(2)
const record = { address: await contract.getAddress(), deployer: wallet.address, chainId: Number(network.chainId), deploymentTxHash: deployment.hash, deployedAt: new Date().toISOString() }
await writeFile(new URL("../deployment-galileo.json", import.meta.url), JSON.stringify(record, null, 2))
console.log(JSON.stringify(record, null, 2))
