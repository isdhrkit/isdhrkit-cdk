#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GitHubOidcStack } from '../lib/github-oidc-stack';

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
