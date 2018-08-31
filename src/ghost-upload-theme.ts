import { GhostApi } from './api/api';
import { debugLog } from './api/debug-log';
import {
  ArgumentsToParse,
  extractArgumentsOrFail,
  Arguments,
  assertFilesExist,
  extractEnvironmentVariablesOrFail,
  Environment,
  getStreamForPath,
} from './utils';
import { createConfig, Config } from './api/config';
const argv: ArgumentsToParse = require('minimist')(process.argv.slice(2));

// checks arguments and files
const args: Arguments = extractArgumentsOrFail(argv);

assertFilesExist(args);

// environment and config
const environment: Environment = extractEnvironmentVariablesOrFail(
  args.environmentPath
);

const config: Config = createConfig(environment);

async function start() {
  const ghostApi: GhostApi = new GhostApi(config);

  if (args.initGhost) {
    debugLog(`initializing ghost`);
    await ghostApi.init();
  }

  await ghostApi.login();

  const uploadThemeRes = await ghostApi.uploadTheme(() =>
    getStreamForPath(args.themePath)
  );

  const [theme] = uploadThemeRes.themes;

  debugLog(`Theme "${theme.name}" uploaded (v${theme.package.version})`);
  await ghostApi.activateTheme(theme);
  debugLog(`Theme "${theme.name}" activated (v${theme.package.version})`);

  if (args.routesPath) {
    await ghostApi.uploadRoutes(() => getStreamForPath(args.routesPath));
    debugLog(`Routes "${args.routesPath}" loaded`);
  }

  if (args.contentPath) {
    await ghostApi.uploadContent(() => getStreamForPath(args.contentPath));
    debugLog(`Content "${args.contentPath}" loaded`);
  }
}

// tslint:disable-next-line:no-floating-promises
start();
