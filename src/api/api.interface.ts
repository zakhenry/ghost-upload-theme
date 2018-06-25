export interface ClientConfig {
  clientId: string;
  clientSecret: string;
}

export interface ClientAuth {
  grant_type: 'password';
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
}

export interface Credentials {
  email: string;
  password: string;
}

// HTTP-RESPONSE
export interface ConfigurationResponse {
  configuration: [
    {
      clientId: string;
      clientSecret: string;
    }
  ];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface UploadThemeResponse {
  themes: [
    {
      name: string;
      package: {
        name: string;
        description: string;
        version: string;
      };
      active: false;
    }
  ];
}
