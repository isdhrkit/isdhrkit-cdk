import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { getCurrentConfig } from './config';

export interface HirokitSiteStackProps extends cdk.StackProps {
  certificate: acm.Certificate;
}

export class HirokitSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HirokitSiteStackProps) {
    super(scope, id, props);

    const config = getCurrentConfig();
    const fullDomainName = `${config.domain.subDomain}.${config.domain.domainName}`;

    // Route 53のホストゾーンを取得
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: config.domain.domainName,
    });

    // S3バケットの作成
    const siteBucket = new s3.Bucket(this, `${config.environment}SiteBucket`, {
      bucketName: config.s3.bucketName,
      // バケットの公開アクセスをブロック
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // オブジェクト所有権をバケット所有者に強制
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    // CloudFront Function の作成
    const appendIndexFunction = new cloudfront.Function(this, `${config.environment}AppendIndexHtml`, {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          
          // Check whether the URI is missing a file name.
          if (uri.endsWith('/')) {
            request.uri += 'index.html';
          }
          // Check whether the URI is missing a file extension.
          else if (!uri.includes('.')) {
            request.uri += '/index.html';
          }
          
          return request;
        }
      `),
      comment: 'Add index.html to the path',
    });

    // SSM から公開鍵を取得
    const publicKey = ssm.StringParameter.fromStringParameterAttributes(this, `${config.environment}HirokitSecretPagePublicKey`, {
      parameterName: `/cloudfront/hirokit/secret/public_key`,
    }).stringValue;

    
    // キーグループの作成
    const keyGroup = new cloudfront.KeyGroup(this, `${config.environment}CloudFrontHirokitSecretPageKeyGroup`, {
      items: [
        new cloudfront.PublicKey(this, `${config.environment}CloudFrontHirokitSecretPagePublicKey`, {
          encodedKey: publicKey,
        }),
      ],
    });

    // CloudFrontディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, `${config.environment}SiteDistribution`, {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originPath: config.s3.contentPath,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [{
          function: appendIndexFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      // 追加のビヘイビアを設定
      additionalBehaviors: {
        '/secret/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
            originPath: `${config.s3.contentPath}/secret`,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          trustedKeyGroups: [keyGroup],
          functionAssociations: [{
            function: appendIndexFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          }],
        },
        '/404.html': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
            originPath: `${config.s3.contentPath}/errors`,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      // 代替ドメイン名の設定
      domainNames: [fullDomainName],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
      // 404エラーページの設定を追加
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
        }
      ],
    });

    // CloudFrontのOACからのアクセスを許可するバケットポリシーを追加
    // OAC を有効化した時点で s3:GetObject が付与されるが、明示的に記述しておく
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        principals: [
          new iam.ServicePrincipal('cloudfront.amazonaws.com')
        ],
        resources: [
          siteBucket.arnForObjects('*'),  // オブジェクトへのアクセス
          siteBucket.bucketArn,          // バケットのルートへのアクセス
        ],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
          }
        }
      })
    );

    // Route 53にAレコードを作成
    new route53.ARecord(this, `${config.environment}SiteAliasRecord`, {
      zone,
      recordName: config.domain.subDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // スタックの出力としてCloudFrontのドメイン名を表示
    new cdk.CfnOutput(this, `${config.environment}DistributionDomainName`, {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });
  }
} 