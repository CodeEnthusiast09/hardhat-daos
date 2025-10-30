// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const boxModule = buildModule("BoxModule", (m) => {
    const deployer = m.getAccount(0);

    const box = m.contract("Box", [], {
        from: deployer,
    });

    return { box };
});

export default boxModule;
