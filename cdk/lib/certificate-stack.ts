import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { getCurrentConfig } from './config';

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config = getCurrentConfig();
    const fullDomainName = `${config.domain.subDomain}.${config.domain.domainName}`;

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: config.domain.domainName,
    });

    this.certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: fullDomainName,
      validation: acm.CertificateValidation.fromDns(zone),
    });
  }
}