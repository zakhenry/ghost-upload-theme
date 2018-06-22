import {
  ArgumentsToParse,
  extractArgumentsOrFail,
  Arguments,
  checkFilesExistsOrFail,
} from './utils';
const argv: ArgumentsToParse = require('minimist')(process.argv.slice(2));

const args: Arguments = extractArgumentsOrFail(argv);

checkFilesExistsOrFail(args);
