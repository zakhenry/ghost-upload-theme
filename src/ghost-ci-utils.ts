import { GhostApi } from './api/api';
import { Config, createConfig } from './api/config';
import { debugLog } from './api/debug-log';
import {
  Action,
  Arguments,
  ArgumentsToParse,
  assertFilesExist,
  Environment,
  extractArgumentsOrFail,
  extractEnvironmentVariablesOrFail,
  getReadStreamForPath,
  getWriteStreamForPath,
} from './utils';

const argv: ArgumentsToParse = require('minimist')(process.argv.slice(2));

// checks arguments and files
const args: Arguments = extractArgumentsOrFail(argv);

// environment and config
const environment: Environment = extractEnvironmentVariablesOrFail(
  args.environmentPath
);

assertFilesExist(args);

const config: Config = createConfig(environment);

async function start() {
  const ghostApi: GhostApi = new GhostApi(config);

  if (args.initGhost) {
    debugLog(`Initializing Ghost...`);
    await ghostApi.init();
    debugLog(`Initialization success.`);
  }

  debugLog(`Logging in...`);
  await ghostApi.login();
  debugLog(`Login success.`);

  switch(args.action) {

    case Action.UPLOAD: {
      if (args.themePath) {
        debugLog(`Uploading Theme...`);
        const uploadThemeRes = await ghostApi.uploadTheme(() =>
          getReadStreamForPath(args.themePath)
        );

        const [theme] = uploadThemeRes.themes;

        debugLog(`Theme "${theme.name}" uploaded (v${theme.package.version}).`);
        debugLog('Activating theme...');
        await ghostApi.activateTheme(theme);
        debugLog(`Theme "${theme.name}" activated (v${theme.package.version}).`);
      }

      if (args.routesPath) {
        debugLog('Activating routes...');
        await ghostApi.uploadRoutes(() => getReadStreamForPath(args.routesPath));
        debugLog(`Routes "${args.routesPath}" loaded`);
      }

      if (args.contentPath) {
        debugLog('Uploading content...');
        await ghostApi.uploadContent(() => getReadStreamForPath(args.contentPath));
        debugLog(`Content "${args.contentPath}" uploaded.`);
      }
      break;
    }

    case Action.DOWNLOAD: {

      if (args.contentPath) {
        debugLog('Downloading content...');
        await ghostApi.downloadContent(() => getWriteStreamForPath(args.contentPath));
        debugLog('Content downloaded.');
      }

    }

  }

}

// tslint:disable-next-line:no-floating-promises
start();
