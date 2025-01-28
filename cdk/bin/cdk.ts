#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GitHubOidcStack } from '../lib/github-oidc-stack';
import { HirokitSiteStack } from '../lib/hirokit-site-stack';
import { GlobalCertificateStack } from '../lib/global-certificate-stack';
import { getCurrentConfig } from '../lib/config';

const app = new cdk.App();

// 環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// GitHub OIDC スタックのデプロイ
const githubOidcStack = new GitHubOidcStack(app, 'GitHubOidcStack', {
  env,
  // GitHub リポジトリの設定
  githubConfig: {
    owner: 'isdhrkit',
    repo: 'isdhrkit-cdk',
  },
});

// 証明書スタック（us-east-1）
const globalCertificateStack = new GlobalCertificateStack(app, `${getCurrentConfig().environment}GlobalCertificateStack`, {
  env: { ...env, region: 'us-east-1' },
  crossRegionReferences: true,
});

// メインのスタック
const hirokitSiteStack = new HirokitSiteStack(app, `${getCurrentConfig().environment}HirokitSiteStack`, {
  env,
  crossRegionReferences: true,
  certificate: globalCertificateStack.certificate,
});
hirokitSiteStack.addDependency(globalCertificateStack);
