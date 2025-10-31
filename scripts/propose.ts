import { ethers, network } from "hardhat";
import {
    developmentChains,
    VOTING_DELAY,
    proposalsFile,
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
} from "../helper-hardhat.config";
import * as fs from "fs";
import { moveBlocks } from "../utils/move-blocks";
import path from "path";

export async function propose(
    args: any[],
    functionToCall: string,
    proposalDescription: string,
) {
    const chainId = network.config.chainId ?? 31337;

    const deploymentPath = path.join(
        __dirname,
        `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
    );

    const deploymentJson = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    const governorContractAddress =
        deploymentJson["GovernorContractModule#GovernorContract"];

    const governor = await ethers.getContractAt(
        "GovernorContract",
        governorContractAddress,
    );

    const boxAddress = deploymentJson["BoxModule#Box"];

    const box = await ethers.getContractAt("Box", boxAddress);

    const encodedFunctionCall = box.interface.encodeFunctionData(
        functionToCall,
        args,
    );

    console.log(`Proposing ${functionToCall} on ${box.address} with ${args}`);
    console.log(`Proposal Description:\n  ${proposalDescription}`);

    const proposeTx = await governor.propose(
        [box.address],
        [0],
        [encodedFunctionCall],
        proposalDescription,
    );

    // If working on a development chain, we will push forward till we get to the voting period.
    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
    }

    const proposeReceipt = await proposeTx.wait(1);

    const proposalId = proposeReceipt.events[0].args.proposalId;

    console.log(`Proposed with proposal ID:\n  ${proposalId}`);

    const proposalState = await governor.state(proposalId);

    const proposalSnapShot = await governor.proposalSnapshot(proposalId);

    const proposalDeadline = await governor.proposalDeadline(proposalId);

    // save the proposalId

    let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));

    proposals[network.config.chainId!.toString()].push(proposalId.toString());

    fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

    // The state of the proposal. 1 is not passed. 0 is passed.
    console.log(`Current Proposal State: ${proposalState}`);
    // What block # the proposal was snapshot
    console.log(`Current Proposal Snapshot: ${proposalSnapShot}`);
    // The block number the proposal voting expires
    console.log(`Current Proposal Deadline: ${proposalDeadline}`);
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
