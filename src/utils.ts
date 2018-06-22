import * as path from 'path';
import * as fs from 'fs';

export interface ArgumentsToParse {
  'theme-path': string;
  'environment-path': string;
}

export interface Arguments {
  themePath: string;
  environmentPath: string;
}

export const extractArgumentsOrFail = (argv: ArgumentsToParse): Arguments => {
  if (!argv['theme-path']) {
    throw new Error(
      'You must provide the argument "theme-path" indicating where to find the theme file (zip)'
    );
  }

  if (!argv['environment-path']) {
    throw new Error(
      'You must provide the argument "environment-path" indicating where to find the environment file (json)'
    );
  }

  return {
    themePath: argv['theme-path'],
    environmentPath: argv['environment-path'],
  };
};

const fileExists = (pathStr: string): boolean => {
  const fullPath: string = path.join(__dirname, '..', pathStr);
  return fs.existsSync(fullPath);
};

export const checkFilesExistsOrFail = (args: Arguments): void => {
  if (!fileExists(args.themePath)) {
    throw new Error('Theme path is invalid: File does not exists');
  }

  if (!fileExists(args.environmentPath)) {
    throw new Error('Environment path is invalid: File does not exists');
  }
};
