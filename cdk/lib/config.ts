export interface SiteConfig {
  environment: string;
  domain: {
    domainName: string;
    subDomain: string;
  };
  s3: {
    bucketName: string;
    contentPath: string;
  };
}

export const config: { [env: string]: SiteConfig } = {
  dev: {
    environment: 'Dev',
    domain: {
      domainName: 'hirokit.jp',
      subDomain: 'dev',
    },
    s3: {
      bucketName: 'hirokit-dev',
      contentPath: '/siteStaticContents',
    },
  },
  stg: {
    environment: 'Stg',
    domain: {
      domainName: 'hirokit.jp',
      subDomain: 'stg',
    },
    s3: {
      bucketName: 'hirokit-stg',
      contentPath: '/siteStaticContents',
    },
  },
  prod: {
    environment: 'Prod',
    domain: {
      domainName: 'hirokit.jp',
      subDomain: 'www',
    },
    s3: {
      bucketName: 'hirokit-prod',
      contentPath: '/siteStaticContents',
    },
  },
};

// 環境変数から現在の環境を取得（デフォルトは'dev'）
export const getCurrentConfig = (): SiteConfig => {
  const environment = process.env.ENVIRONMENT || 'dev';
  const envConfig = config[environment];
  
  if (!envConfig) {
    throw new Error(`Configuration for environment '${environment}' not found`);
  }
  
  return envConfig;
}; 