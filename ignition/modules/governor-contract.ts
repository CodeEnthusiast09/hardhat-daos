// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { QUORUM_PERCENTAGE } from "../../helper-hardhat.config";
import { VOTING_PERIOD } from "../../helper-hardhat.config";
import { VOTING_DELAY } from "../../helper-hardhat.config";

const governorContractModule = buildModule("GovernorContractModule", (m) => {
    const deployer = m.getAccount(0);

    const governorContract = m.contract(
        "GovernorContract",
        [QUORUM_PERCENTAGE, VOTING_PERIOD, VOTING_DELAY],
        {
            from: deployer,
        },
    );

    return { governorContract };
});

export default governorContractModule;
