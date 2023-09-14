#!/usr/bin/env node

import { Command } from 'commander';
import renameFPs from '../index.js';

const program = new Command();
program
  .description('Renaming and compress png images.')
  .version('1.0.0')
  .arguments('<dirpath>')
  .action(async (dirPath) => await renameFPs(dirPath));

program.parse(process.argv);