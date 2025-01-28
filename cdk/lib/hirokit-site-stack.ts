import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
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

    // CloudFrontディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, `${config.environment}SiteDistribution`, {
      // デフォルトのビヘイビア設定
      defaultBehavior: {
        // S3バケットをオリジンとして設定し、OACを有効化
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
          // オリジンパスを指定
          originPath: config.s3.contentPath,
        }),
        // ビューワープロトコルポリシーをHTTPSのみに設定
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      // 代替ドメイン名の設定
      domainNames: [fullDomainName],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
    });

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