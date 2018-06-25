import * as fs from 'fs';
import resolveCwd from 'resolve-cwd';

export interface ArgumentsToParse {
  'theme-path': string;
  'environment-path': string;
}

export interface Arguments {
  themePath: string;
  environmentPath: string;
}

export interface Environment {
  baseUrl: string;
  email: string;
  password: string;
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
  const fullPath: string = resolveCwd(pathStr);
  return fs.existsSync(fullPath);
};

const readFileSync = (pathStr: string): string => {
  const fullPath: string = resolveCwd(pathStr);
  return fs.readFileSync(fullPath, 'utf8');
};

const readJsonSync = <T = any>(pathStr: string): T => {
  return JSON.parse(readFileSync(pathStr));
};

export const getStreamForPath = (pathStr: string): fs.ReadStream => {
  const fullPath: string = resolveCwd(pathStr);

  return fs.createReadStream(fullPath);
};

export const checkFilesExistsOrFail = (args: Arguments): void => {
  if (!fileExists(args.themePath)) {
    throw new Error('Theme path is invalid: File does not exists');
  }

  if (!fileExists(args.environmentPath)) {
    throw new Error('Environment path is invalid: File does not exists');
  }
};

export const extractEnvironmentVariablesOrFail = (
  pathStr: string
): Environment => {
  const environment: Environment = readJsonSync<Environment>(pathStr);

  if (!environment.baseUrl || !environment.email || !environment.password) {
    throw new Error('Envrionment file does not contains required variables');
  }

  return {
    baseUrl: environment.baseUrl,
    email: environment.email,
    password: environment.password,
  };
};
