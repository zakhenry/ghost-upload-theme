import * as fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import {
  ConfigurationResponse,
  ClientConfig,
  AuthResponse,
  ClientAuth,
  UploadThemeResponse,
} from './api.interface';
import { formatAuthParams } from './api.utils';
import { Config } from './config';

export class ErrorFetchClientConfig extends Error {}
export class ErrorAuthClient extends Error {}
export class ErrorUploadTheme extends Error {}

export class GhostApi {
  private token: string = '';

  constructor(private config: Config) {}

  public async init(): Promise<void> {
    const clientConfig: ClientConfig = await this.getClientConfig();

    const authResponse: AuthResponse = await this.getToken({
      grant_type: 'password',
      username: this.config.credentials.email,
      password: this.config.credentials.password,
      client_id: clientConfig.clientId,
      client_secret: clientConfig.clientSecret,
    });

    this.token = authResponse.access_token;
  }

  public uploadTheme(
    getReadStream: () => fs.ReadStream
  ): Promise<UploadThemeResponse> {
    if (!this.token) {
      throw new Error('Before uploading a theme you must call the init method');
    }

    const body = new FormData();
    body.append('theme', getReadStream());

    return fetch(this.config.urls.uploadThemeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body,
    })
      .then(res => res.json() as Promise<UploadThemeResponse>)
      .then((res: UploadThemeResponse) => {
        // when the upload of a theme fails the API does not return an error
        // code but just pass the error as part of the regular response...
        if (!res.themes) {
          throw new Error(`${res}`);
        }

        return res;
      })
      .catch(err => {
        console.log(
          `Something went wrong while trying to uplaod the theme`,
          err
        );
        throw new ErrorUploadTheme();
      });
  }

  private getClientConfig(): Promise<ClientConfig> {
    return fetch(this.config.urls.configUrl)
      .then(res => res.json() as Promise<ConfigurationResponse>)
      .then((res: ConfigurationResponse) => {
        const [configuration] = res.configuration;
        return configuration;
      })
      .catch(err => {
        console.log(`Something went wrong while fetching the config`, err);
        throw new ErrorFetchClientConfig();
      });
  }

  private getToken(clientAuth: ClientAuth): Promise<AuthResponse> {
    return fetch(this.config.urls.authUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formatAuthParams(clientAuth),
    })
      .then(res => res.json() as Promise<AuthResponse>)
      .catch(err => {
        console.log(`Something went wrong while trying to log in`, err);
        throw new ErrorAuthClient();
      });
  }
}
