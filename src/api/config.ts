import { Environment } from './../utils';

export interface Config {
  credentials: {
    email: string;
    password: string;
  };
  urls: {
    configUrl: string;

    authUrl: string;

    uploadThemeUrl: string;
  };
}

export const createConfig = (env: Environment): Config => ({
  credentials: {
    email: env.email,
    password: env.password,
  },
  urls: {
    configUrl: `${env.baseUrl}/configuration`,

    authUrl: `${env.baseUrl}/authentication/token`,

    uploadThemeUrl: `${env.baseUrl}/themes/upload/`,
  },
});
