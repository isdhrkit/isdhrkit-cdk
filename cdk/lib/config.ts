export interface SiteConfig {
  domain: {
    domainName: string;
    wwwSubDomain: string;
  };
  s3: {
    bucketName: string;
    contentPath: string;
  };
}

export const config: { [env: string]: SiteConfig } = {
  dev: {
    domain: {
      domainName: 'hirokit.jp',
      wwwSubDomain: 'dev',
    },
    s3: {
      bucketName: 'hirokit-dev',
      contentPath: '/siteStaticContents',
    },
  },
  stg: {
    domain: {
      domainName: 'hirokit.jp',
      wwwSubDomain: 'stg',
    },
    s3: {
      bucketName: 'hirokit-stg',
      contentPath: '/siteStaticContents',
    },
  },
  prod: {
    domain: {
      domainName: 'hirokit.jp',
      wwwSubDomain: 'www',
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