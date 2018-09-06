import * as fs from 'fs';
import resolveCwd from 'resolve-cwd';
import dotenv from 'dotenv';
import getenv from 'getenv';
import { debugLog } from './api/debug-log';

export interface ArgumentsToParse {
  'theme-path': string;
  upload: 'upload';
  download: 'download';
  'routes-path': string;
  'content-path': string;
  'environment-path': string;
  'prepend-image-url': string;
  init: 'init';
}

export enum Action {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
}

export interface Arguments {
  action: Action;
  themePath: string;
  routesPath: string;
  contentPath: string;
  initGhost: boolean;
  environmentPath: string;
  prependImageUrl?: string;
}

export interface Environment {
  baseUrl: string;
  email: string;
  password: string;
}

export const extractArgumentsOrFail = (argv: ArgumentsToParse): Arguments => {
  if (!argv['upload'] && argv['download']) {
    throw new Error(
      'You must provide the argument --upload or --download indicating the transmission direction'
    );
  }

  const action = argv['upload'] ? Action.UPLOAD : Action.DOWNLOAD;

  return {
    action,
    initGhost: !!argv['init'],
    themePath: argv['theme-path'],
    contentPath: argv['content-path'],
    routesPath: argv['routes-path'],
    environmentPath: argv['environment-path'],
    prependImageUrl: action === Action.DOWNLOAD ? argv['prepend-image-url'] || getenv('GHOST_URL') : undefined,
  };
};

const fileExists = (pathStr: string): boolean => {
  const fullPath: string = resolveCwd(pathStr);
  return fs.existsSync(fullPath);
};

export const getReadStreamForPath = (pathStr: string): fs.ReadStream => {
  const fullPath: string = resolveCwd(pathStr);

  return fs.createReadStream(fullPath);
};

export const getWriteStreamForPath = (pathStr: string): fs.WriteStream => {
  const fullPath: string = resolveCwd(pathStr);

  return fs.createWriteStream(fullPath);
};

export const assertFilesExist = (args: Arguments): void => {
  if (!fileExists(args.themePath)) {
    throw new Error('Theme path is invalid: File does not exist');
  }
};

export const extractEnvironmentVariablesOrFail = (
  path: string | undefined
): Environment => {
  const result = dotenv.config(path ? { path } : undefined);

  if (result.error) {
    if (!path && result.error.code === 'ENOENT') {
      debugLog('No .env file detected, using environment variables only');
    } else {
      throw result.error;
    }
  }

  return {
    baseUrl: getenv('GHOST_URL'),
    email: getenv('GHOST_ADMIN_EMAIL'),
    password: getenv('GHOST_ADMIN_PASSWORD'),
  };
};
