/**
 * trmnl-cli - CLI tool for TRMNL e-ink displays
 *
 * Commands:
 *   trmnl send       - Send content to TRMNL display
 *   trmnl validate   - Validate payload without sending
 *   trmnl config     - Manage CLI configuration
 *   trmnl history    - View send history
 */

import { createRequire } from "node:module";
import cac from "cac";
import { registerConfigCommand } from "./commands/config.ts";
import { registerHistoryCommand } from "./commands/history.ts";
import { registerSendCommand } from "./commands/send.ts";
import { registerValidateCommand } from "./commands/validate.ts";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const cli = cac("trmnl");

cli.version(version);

// Register commands
registerSendCommand(cli);
registerValidateCommand(cli);
registerConfigCommand(cli);
registerHistoryCommand(cli);

// Help text
cli.help();

// Default action (no command)
cli.command("").action(() => {
  cli.outputHelp();
});

// Parse and run
cli.parse();
