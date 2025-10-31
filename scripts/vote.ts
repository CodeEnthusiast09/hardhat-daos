import * as fs from "fs";
import { network, ethers } from "hardhat";
import {
    proposalsFile,
    developmentChains,
    VOTING_PERIOD,
} from "../helper-hardhat.config";
import { moveBlocks } from "../utils/move-blocks";
import path from "path";

const index = 0;

async function main(proposalIndex: number) {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    // You could swap this out for the ID you want to use too
    const proposalId = proposals[network.config.chainId!][proposalIndex];
    // 0 = Against, 1 = For, 2 = Abstain for this example
    const voteWay = 1;
    const reason = "I lika do da cha cha";
    await vote(proposalId, voteWay, reason);
}

// 0 = Against, 1 = For, 2 = Abstain for this example
export async function vote(
    proposalId: string,
    voteWay: number,
    reason: string,
) {
    console.log("Voting...");
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

    const voteTx = await governor.castVoteWithReason(
        proposalId,
        voteWay,
        reason,
    );
    const voteTxReceipt = await voteTx.wait(1);
    console.log(voteTxReceipt.events[0].args.reason);
    const proposalState = await governor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);
    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }
}

main(index)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
