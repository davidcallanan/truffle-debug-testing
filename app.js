console.log("importing modules...");
import ganache from "ganache";
import Web3 from "web3";
import fs from "fs";
import solc from "solc";
import Debugger from "@truffle/debugger";

console.log("creating provider...");

let provider = ganache.provider({
	fork: {
		network: "mainnet",
		// blockNumber: 14048830 + 1,
		// blockNumber: 14048830,
		// blockNumber: 14128780,
		blockNumber: 14128830,
	},
	logging: {
		quiet: true,
	},
	chain: {
		vmErrorsOnRPCResponse: false,
	},
	// mining: {
	// 	blockTime: 10,
	// }
});

console.log("connecting to provider...");

await provider.once("connect");

console.log("setting up web3...");

let web3 = new Web3(provider, null, {
	transactionConfirmationBlocks: 1,
});

//////////////////////////////////////

let promise_resolve;
let promise = new Promise((res) => {
	promise_resolve = res;
});

let output;
let contracts = [];

console.log("loading solidity compiler...");

// solc.loadRemoteVersion("v0.7.4+commit.3f05b770", (error, solcSnapshot) => {
// solc.loadRemoteVersion("v0.4.15+commit.bbb8e64f", (error, solcSnapshot) => {
solc.loadRemoteVersion("v0.6.6+commit.6c089d02", (error, solcSnapshot) => {
	console.log("starting compilation process...");

	if (error) {
		console.log("Error with loading remote solidity compiler!");
		console.error(error);
	}

	// let source = fs.readFileSync("./code.sol").toString();
	let source = fs.readFileSync("./code2.sol").toString();

	let input = {
		language: "Solidity",
		sources: {
			// "code.sol": {
			"code2.sol": {
				content: source,
			},
		},
		settings: {
			outputSelection: {
				'*': {
					'*': ['*'],
					"": ["ast"],
				},
			},
		},
	};
	
	output = JSON.parse(solcSnapshot.compile(JSON.stringify(input)));

	fs.writeFileSync("./code.json", JSON.stringify(output, null, 2));

	let targetContractName = "GraphToken";

	for (let fileName in output.contracts) {
		let subContracts = output.contracts[fileName];

		for (let contractName in subContracts) {
			// if (contractName != targetContractName) {
			// 	continue;
			// }
	
			let contractData = subContracts[contractName];
			contracts.push({
				contractName,
				source,
				// sourcePath: "./code.sol",
				sourcePath: "./code2.sol",
				// ast: output.sources["code.sol"].ast,
				ast: output.sources["code2.sol"].ast,
				binary: `0x${contractData.evm.bytecode.object}`,
				sourceMap: contractData.evm.bytecode.sourceMap,
				deployedBinary: `0x${contractData.evm.deployedBytecode.object}`,
				deployedSourceMap: contractData.evm.deployedBytecode.sourceMap,
				abi: contractData.abi,
			});
		}
	}

	fs.writeFileSync("./code.json", JSON.stringify(output, null, 2));

	console.log("compilation process complete.");
	
	promise_resolve();
});

console.log("waiting to be ready...");
await promise;
console.log("ready waiting!");

// let transactionHash = "0x03e784bfcb8f6175f7a321586f671dff08a87070f62f5c9ae928e8f2c31e17bd";
// let transactionHash = "0x5927ebe3c0fbb223ac099d10da6b57bada7add95c6ec564c5f5e58f892adfe86";
let transactionHash = "0x5c4e25f92bc77d8132e49d28efa51eee8b4406d0dfa87130f2bfb362358ea106";

console.log("intiailizing debugger...");

fs.writeFileSync("./contracts.json", JSON.stringify(contracts, null, 2));

let bugger = await Debugger.forTx(
	transactionHash,
	{
		provider: web3.currentProvider,
		contracts,
		// files: [],
	},
);

console.log("connecting to debugger...");
let session = bugger.connect();
console.log("awaiting session ready...");
await session.ready();
console.log("debugger session ready!");

console.log("Stepping...");
for (let i = 0; i < 10000; i++) {
	let result = await session.stepNext();
	// console.log("Stepping result:", result);
}

console.log("Stepping complete");

fs.writeFileSync("./state.json", JSON.stringify(session.state, null, 2));

console.log("Viewing variables...");

let { ast, data, evm, solidity, trace } = Debugger.selectors;
let view = session.view(data.current.identifiers.sections);
fs.writeFileSync("./view.json", JSON.stringify(view, null, 2));
console.log(view);
let variables = await session.variables();
fs.writeFileSync("./variables.json", JSON.stringify(variables, null, 2));
console.log(variables);

console.log("DONE");
