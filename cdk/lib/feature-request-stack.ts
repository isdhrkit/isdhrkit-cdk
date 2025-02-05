import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { getCurrentConfig } from './config';

export class FeatureRequestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = getCurrentConfig();

    // DynamoDB テーブルの作成
    const featureRequestTable = new dynamodb.Table(this, `${config.environment}FeatureRequestTable`, {
      tableName: `${config.environment.toLowerCase()}-feature-requests`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      // GSIは今のところ不要なので定義しない
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // オンデマンドモードで費用を抑える
      removalPolicy: cdk.RemovalPolicy.RETAIN, // 誤削除防止
      timeToLiveAttribute: 'ttl', // 必要に応じてTTLを設定可能
      pointInTimeRecovery: true, // バックアップを有効化
    });

    // テーブル名をスタックの出力として表示
    new cdk.CfnOutput(this, `${config.environment}FeatureRequestTableName`, {
      value: featureRequestTable.tableName,
      description: 'Feature Request DynamoDB table name',
    });
  }
} 