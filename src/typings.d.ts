declare module 'resolve-cwd' {
  const resolveCwd: (path: string) => string;
  export = resolveCwd;
}

declare module 'dotenv' {
  interface Dotenv {
    config(options?: { path: string }): { error?: NodeJS.ErrnoException };
  }

  const dotenv: Dotenv;

  export = dotenv;
}

declare module 'getenv' {
  const getenv: (key: string) => string;
  export = getenv;
}
