import { GhostApi } from './api/api';
import {
  ArgumentsToParse,
  extractArgumentsOrFail,
  Arguments,
  checkFilesExistsOrFail,
  extractEnvironmentVariablesOrFail,
  Environment,
  getStreamForPath,
} from './utils';
import { createConfig, Config } from './api/config';
const argv: ArgumentsToParse = require('minimist')(process.argv.slice(2));

// checks arguments and files
const args: Arguments = extractArgumentsOrFail(argv);

checkFilesExistsOrFail(args);

// environment and config
const environment: Environment = extractEnvironmentVariablesOrFail(
  args.environmentPath
);

const config: Config = createConfig(environment);

async function start() {
  const ghostApi: GhostApi = new GhostApi(config);

  await ghostApi.init();

  const uploadThemeRes = await ghostApi.uploadTheme(() =>
    getStreamForPath(args.themePath)
  );

  const [theme] = uploadThemeRes.themes;

  console.log(
    `Theme "${theme.name}" has been uploaded (v ${theme.package.version})`
  );
}

// tslint:disable-next-line:no-floating-promises
start();
