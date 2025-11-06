import { ethers, network } from "hardhat";
import { assert, expect } from "chai";
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
    VOTING_DELAY,
    VOTING_PERIOD,
    MIN_DELAY,
} from "../../helper-hardhat.config";
import { moveBlocks } from "../../utils/move-blocks";
import { moveTime } from "../../utils/move-time";
import fs from "fs";
import path from "path";
import {
    Box,
    GovernanceToken,
    GovernorContract,
    TimeLock,
} from "../../typechain-types";

describe("Governor Flow", async () => {
    let governor: GovernorContract;
    let governanceToken: GovernanceToken;
    let timeLock: TimeLock;
    let box: Box;
    const voteWay = 1; // for
    const reason = "I lika do da cha cha";

    beforeEach(async () => {
        // Get chain ID
        const chainId = network.config.chainId ?? 31337;

        // Read deployed addresses from Ignition
        const deploymentPath = path.join(
            __dirname,
            `../../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
        );

        const deploymentJson = JSON.parse(
            fs.readFileSync(deploymentPath, "utf8"),
        );

        // Get contract addresses
        const governorAddress =
            deploymentJson["GovernorContractModule#GovernorContract"];
        const timeLockAddress = deploymentJson["TimeLockModule#TimeLock"];
        const governanceTokenAddress =
            deploymentJson["GovernanceTokenModule#GovernanceToken"];
        const boxAddress = deploymentJson["BoxModule#Box"];

        // Get contract instances
        governor = await ethers.getContractAt(
            "GovernorContract",
            governorAddress,
        );
        timeLock = await ethers.getContractAt("TimeLock", timeLockAddress);
        governanceToken = await ethers.getContractAt(
            "GovernanceToken",
            governanceTokenAddress,
        );
        box = await ethers.getContractAt("Box", boxAddress);
    });

    it("can only be changed through governance", async () => {
        await expect(box.store(55)).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );
    });

    it("proposes, votes, waits, queues, and then executes", async () => {
        // propose
        const boxAddress = await box.getAddress(); // ethers v6
        const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [
            NEW_STORE_VALUE,
        ]);

        const proposeTx = await governor.propose(
            [boxAddress], // use getAddress()
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION,
        );

        const proposeReceipt = await proposeTx.wait(1);

        const proposalCreatedEvent = proposeReceipt?.logs.find((log: any) => {
            try {
                const parsed = governor.interface.parseLog(log);
                return parsed?.name === "ProposalCreated";
            } catch {
                return false;
            }
        });

        if (!proposalCreatedEvent) {
            throw new Error("ProposalCreated event not found");
        }

        const parsedEvent = governor.interface.parseLog(proposalCreatedEvent);

        const proposalId = parsedEvent?.args.proposalId;

        let proposalState = await governor.state(proposalId);

        console.log(`Current Proposal State: ${proposalState}`);

        await moveBlocks(VOTING_DELAY + 1);

        // vote
        const voteTx = await governor.castVoteWithReason(
            proposalId,
            voteWay,
            reason,
        );
        await voteTx.wait(1);
        proposalState = await governor.state(proposalId);
        assert.equal(proposalState.toString(), "1");
        console.log(`Current Proposal State: ${proposalState}`);
        await moveBlocks(VOTING_PERIOD + 1);

        // queue & execute
        const descriptionHash = ethers.id(PROPOSAL_DESCRIPTION); // ethers v6

        const queueTx = await governor.queue(
            [boxAddress],
            [0],
            [encodedFunctionCall],
            descriptionHash,
        );
        await queueTx.wait(1);
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);

        proposalState = await governor.state(proposalId);
        console.log(`Current Proposal State: ${proposalState}`);

        console.log("Executing...");

        const exTx = await governor.execute(
            [boxAddress],
            [0],
            [encodedFunctionCall],
            descriptionHash,
        );
        await exTx.wait(1);

        const storedValue = await box.retrieve();
        console.log(storedValue.toString());
        assert.equal(storedValue.toString(), NEW_STORE_VALUE.toString());
    });
});
