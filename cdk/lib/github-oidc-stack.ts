import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface GitHubOidcStackProps extends cdk.StackProps {
  githubConfig: {
    owner: string;
    repo: string;
  };
}

export class GitHubOidcStack extends cdk.Stack {
  public readonly deployRole: iam.Role;

  constructor(scope: Construct, id: string, props: GitHubOidcStackProps) {
    super(scope, id, props);

    // GitHub OIDC プロバイダーの作成
    const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    });

    // GitHub Actions 用の IAM ロールの作成
    this.deployRole = new iam.Role(this, 'GitHubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, {
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.githubConfig.owner}/${props.githubConfig.repo}:*`,
        },
      }),
      description: 'Role for GitHub Actions to deploy CDK stacks',
      roleName: 'GitHubActionsCDKDeployRole',
    });

    // CDK デプロイに必要な権限を付与
    this.deployRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')
    );

    // ロールARNを出力として追加
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: this.deployRole.roleArn,
      description: 'ARN of IAM Role for GitHub Actions',
      exportName: 'GitHubActionsRoleArn',
    });
  }
} 