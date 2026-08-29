import { readFile, mkdir, writeFile } from "node:fs/promises"
import solc from "solc"

const source = await readFile(new URL("../contracts/ConsentLayerRegistry.sol", import.meta.url), "utf8")
const input = {
  language: "Solidity",
  sources: { "ConsentLayerRegistry.sol": { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
}
const output = JSON.parse(solc.compile(JSON.stringify(input)))
if (output.errors?.some((error) => error.severity === "error")) {
  console.error(output.errors)
  process.exit(1)
}
const contract = output.contracts["ConsentLayerRegistry.sol"].ConsentLayerRegistry
await mkdir(new URL("../artifacts", import.meta.url), { recursive: true })
await writeFile(new URL("../artifacts/ConsentLayerRegistry.json", import.meta.url), JSON.stringify({ abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` }, null, 2))
console.log("Compiled ConsentLayerRegistry")
