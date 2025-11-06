import { ethers, network } from "hardhat";
import {
    FUNC,
    NEW_STORE_VALUE,
    PROPOSAL_DESCRIPTION,
    MIN_DELAY,
    developmentChains,
} from "../helper-hardhat.config";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";
import * as fs from "fs";
import path from "path";

export async function queueAndExecute() {
    const args = [NEW_STORE_VALUE];
    const functionToCall = FUNC;

    const chainId = network.config.chainId ?? 31337;

    const deploymentPath = path.join(
        __dirname,
        `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
    );

    const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const boxAddress = deploymentJson["BoxModule#Box"];

    const box = await ethers.getContractAt("Box", boxAddress);

    const encodedFunctionCall = box.interface.encodeFunctionData(
        functionToCall as any,
        args,
    );

    const descriptionHash = ethers.keccak256(
        ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION),
    );
    // could also use ethers.utils.id(PROPOSAL_DESCRIPTION)

    const governorContractAddress =
        deploymentJson["GovernorContractModule#GovernorContract"];

    const governor = await ethers.getContractAt(
        "GovernorContract",
        governorContractAddress,
    );

    console.log("Queueing...");
    const queueTx = await governor.queue(
        [box.target],
        [0],
        [encodedFunctionCall],
        descriptionHash,
    );
    await queueTx.wait(1);

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
    }

    console.log("Executing...");
    // this will fail on a testnet because you need to wait for the MIN_DELAY!
    const executeTx = await governor.execute(
        [box.target],
        [0],
        [encodedFunctionCall],
        descriptionHash,
    );
    await executeTx.wait(1);
    const boxNewValue = await box.retrieve();
    console.log(boxNewValue.toString());
}

queueAndExecute()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
