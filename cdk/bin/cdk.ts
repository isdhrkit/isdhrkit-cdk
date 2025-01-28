#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GitHubOidcStack } from '../lib/github-oidc-stack';
import { HirokitSiteStack } from '../lib/hirokit-site-stack';
import { CertificateStack } from '../lib/certificate-stack';

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
const certificateStack = new CertificateStack(app, 'HirokitCertificateStack', {
  env: { ...env, region: 'us-east-1' },
  crossRegionReferences: true,
});

// メインのスタック
const hirokitSiteStack = new HirokitSiteStack(app, 'HirokitSiteStack', {
  env,
  crossRegionReferences: true,
  certificate: certificateStack.certificate,
});
hirokitSiteStack.addDependency(certificateStack);
