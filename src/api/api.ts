import * as fs from 'fs';
import fetch, { Request, RequestInit } from 'node-fetch';
import FormData from 'form-data';
import {
  ConfigurationResponse,
  ClientConfig,
  AuthResponse,
  ClientAuth,
  ThemeResponse,
  InitResponse,
  Theme,
  RoutesResponse,
  ContentResponse,
  GhostResponse,
} from './api.interface';
import { formatAuthParams } from './api.utils';
import { Config } from './config';
import { debugLog } from './debug-log';

export class ErrorFetchClientConfig extends Error {}
export class ErrorAuthClient extends Error {}
export class ErrorUploadTheme extends Error {}
export class ErrorUploadContent extends Error {}
export class ErrorUploadRoutes extends Error {}
export class ErrorActivateTheme extends Error {}

export class GhostApi {
  private token: string = '';

  constructor(private config: Config) {}

  public async init(): Promise<InitResponse> {
    const body = {
      setup: [
        {
          name: 'ghost-upload-theme-bot',
          email: this.config.credentials.email,
          password: this.config.credentials.password,
          blogTitle: 'Temporary Blog Title',
        },
      ],
    };

    const initResponse: InitResponse = await fetch(this.config.urls.setupUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(res => res.json() as Promise<InitResponse>)
      .catch(err => {
        debugLog(`Something went wrong while trying to initialize ghost`, err);
        throw new ErrorAuthClient();
      });

    if (initResponse.errors) {
      console.error(initResponse.errors);
      throw new Error(initResponse.errors[0].message);
    }

    debugLog(`response was`, initResponse);
    debugLog(`this.config.urls.setupUrl`, this.config.urls.setupUrl);

    return initResponse;
  }

  public async login(): Promise<void> {
    const clientConfig: ClientConfig = await this.getClientConfig();

    const authResponse: AuthResponse = await this.getToken({
      grant_type: 'password',
      username: this.config.credentials.email,
      password: this.config.credentials.password,
      client_id: clientConfig.clientId,
      client_secret: clientConfig.clientSecret,
    });

    if (authResponse.errors) {
      console.error(authResponse.errors);
      throw new Error(authResponse.errors[0].message);
    }

    this.token = authResponse.access_token;
  }

  public uploadTheme(
    getReadStream: () => fs.ReadStream
  ): Promise<ThemeResponse> {
    if (!this.token) {
      throw new Error(
        'Before uploading a theme you must call the login method'
      );
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
      .then(res => res.json() as Promise<ThemeResponse>)
      .then((res: ThemeResponse) => {
        // when the upload of a theme fails the API does not return an error
        // code but just pass the error as part of the regular response...
        if (!res.themes) {
          throw new Error(`${res}`);
        }

        return res;
      })
      .catch(err => {
        debugLog(`Something went wrong while trying to upload the theme`, err);
        throw new ErrorUploadTheme();
      });
  }

  public activateTheme(theme: Theme): Promise<ThemeResponse> {
    if (!this.token) {
      throw new Error(
        'Before uploading a theme you must call the login method'
      );
    }

    return fetch(this.config.urls.activateThemeUrl(theme.name), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })
      .then(res => res.json() as Promise<ThemeResponse>)
      .then((res: ThemeResponse) => {
        // when the upload of a theme fails the API does not return an error
        // code but just pass the error as part of the regular response...
        if (!res.themes) {
          throw new Error(`${res}`);
        }

        return res;
      })
      .catch(err => {
        debugLog(`Something went wrong while trying to upload the theme`, err);
        throw new ErrorActivateTheme();
      });
  }

  public uploadRoutes(
    getReadStream: () => fs.ReadStream
  ): Promise<RoutesResponse> {
    if (!this.token) {
      throw new Error('Before uploading routes you must call the login method');
    }

    const body = new FormData();
    body.append('routes', getReadStream());

    return fetch(this.config.urls.uploadRoutesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body,
    })
      .then(res => res.json() as Promise<RoutesResponse>)
      .then((res: RoutesResponse) => {
        // when the upload of a theme fails the API does not return an error
        // code but just pass the error as part of the regular response...
        if (res.errors) {
          throw new Error(`${res}`);
        }

        return res;
      })
      .catch(err => {
        debugLog(`Something went wrong while trying to upload the routes`, err);
        throw new ErrorUploadRoutes();
      });
  }

  public async uploadContent(
    getReadStream: () => fs.ReadStream
  ): Promise<ContentResponse> {
    if (!this.token) {
      throw new Error(
        'Before uploading content you must call the login method'
      );
    }

    const body = new FormData();
    body.append('importfile', getReadStream());

    const content = await this.fetchRetryOnErrors(
      this.config.urls.uploadContentUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body,
      },
      ['MaintenanceError']
    )
      .then((res: ContentResponse) => {
        // when the upload of a theme fails the API does not return an error
        // code but just pass the error as part of the regular response...
        if (res.errors) {
          debugLog(
            `Something went wrong while trying to upload the content`,
            res.errors
          );
          throw new Error(`${res.errors[0].message}`);
        }

        return res;
      })
      .catch(err => {
        debugLog(
          `Something went wrong while trying to upload the content`,
          err.message
        );
        throw new ErrorUploadContent(err.message);
      });

    debugLog('Content uploaded', content);

    return content;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @todo this doesn't work as for some reason the retried fetch times out
   */
  private async fetchRetryOnErrors<R extends GhostResponse>(
    url: string | Request,
    init: RequestInit,
    retryErrorTypes: string[]
  ): Promise<R> {
    const makeAttempt = (retries: number): Promise<R> => {
      debugLog(`Calling ${init.method} ${url}`);
      return fetch(url, { ...init, ...{ timeout: 1000 } })
        .then(res => res.json() as Promise<R>)
        .then(async (res: R) => {
          debugLog(`Got`, res);

          if (
            res.errors &&
            res.errors.some(e => retryErrorTypes.includes(e.errorType))
          ) {
            if (retries > 5) {
              throw new Error('count exceeded');
            }

            debugLog(
              `${init.method} ${url} failed due to ${
                res.errors.find(e => retryErrorTypes.includes(e.errorType))!
                  .errorType
              }`
            );
            await this.sleep(retries * 1000);
            debugLog(`Retrying ${init.method} ${url}`);

            return makeAttempt(++retries);
          }

          return res;
        });
    };

    return makeAttempt(0);
  }

  private getClientConfig(): Promise<ClientConfig> {
    return fetch(this.config.urls.configUrl)
      .then(res => res.json() as Promise<ConfigurationResponse>)
      .then((res: ConfigurationResponse) => {
        const [configuration] = res.configuration;
        return configuration;
      })
      .catch(err => {
        debugLog(`Something went wrong while fetching the config`, err);
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
        debugLog(`Something went wrong while trying to log in`, err);
        throw new ErrorAuthClient();
      });
  }
}
