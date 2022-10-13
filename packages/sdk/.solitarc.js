const fs = require('fs');
const os = require('os');
const path = require('path');

const { programId, programName } = parseAnchorToml()

if (!programId) {
  throw new Error('Invalid `Anchor.toml`')
}

const programDir = path.join(__dirname, '..', '..', 'programs', programName);
const idlDir = path.join(__dirname, 'idl');
const sdkDir = path.join(__dirname, 'src', 'generated');
const binaryInstallDir = path.join(os.homedir(), '.cargo');
// const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName,
  programId,
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};

function parseAnchorToml() {
  const anchor = fs.readFileSync(path.join(__dirname, '..', '..', 'Anchor.toml'))
  const reg_pattern = /\[programs.+\]\n(.+) = \"(.+)\"/i
  const matches = reg_pattern.exec(anchor.toString())
  if (matches) {
    return {
      programName: matches[1],
      programId: matches[2],
    }
  }
  return {
    programName: undefined,
    programId: undefined,
  }
}
