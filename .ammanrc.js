const path = require('path');
const {LOCALHOST, tmpLedgerDir} = require('@metaplex-foundation/amman');

//
// How to dump a program
//
//  solana program dump SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy ./target/deploy/stake_pool.so
//

const programIds = {
  stake_pool: 'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy',
  // metadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  // vault: 'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn',
  // auction: 'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8',
  // metaplex: 'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98',
  // fixedPriceSaleToken: 'SaLeTjyUa5wXHnGuewUSyJ5JWZaHwz3TxqUntCE9czo',
  // candyMachine: 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ'
};

function localDeployPath(programName) {
  return path.join(__dirname, 'target', 'deploy', `${programName}.so`);
}

module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [
      {
        label: 'Stake Pool',
        programId: programIds.stake_pool,
        deployPath: localDeployPath('stake_pool')
      },
      // {
      //   label: 'Token Metadata Program',
      //   programId: programIds.metadata,
      //   deployPath: localDeployPath('mpl_token_metadata')
      // },
    ],
    jsonRpcUrl: LOCALHOST,
    websocketUrl: '',
    commitment: 'singleGossip',
    ledgerDir: tmpLedgerDir(),
    resetLedger: true,
    verifyFees: false,
    detached: process.env.CI != null,
  },
  relay: {
    enabled: process.env.CI == null,
    killlRunningRelay: true,
  },
  storage: {
    enabled: process.env.CI == null,
    storageId: 'mock-storage',
    clearOnStart: true,
  },
};
