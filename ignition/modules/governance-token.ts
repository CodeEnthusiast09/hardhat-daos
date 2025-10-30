// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const governanceTokenModule = buildModule("GovenanceTokenModule", (m) => {
    const deployer = m.getAccount(0);

    const governanceToken = m.contract("GovernanceToken", [], {
        from: deployer,
    });

    return { governanceToken };
});

export default governanceTokenModule;
