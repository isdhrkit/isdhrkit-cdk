import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3バケットの作成
    new s3.Bucket(this, 'HirokitBucket', {
      bucketName: 'hirokit',
      // バケットを削除する際にバケット内のオブジェクトも削除
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // バケット内のオブジェクトを自動削除
      autoDeleteObjects: false,
    });
  }
} 