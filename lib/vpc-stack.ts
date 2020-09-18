import { IVpc, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export class VpcStack extends Stack {
  readonly vpc: IVpc;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.vpc = new Vpc(this, "NewVPC", {
      cidr: "10.0.0.0/16",
      // needed for RDS
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "Database",
          subnetType: SubnetType.ISOLATED,
        },
        {
          name: "Application",
          subnetType: SubnetType.PRIVATE,
        },
        {
          name: "Public",
          subnetType: SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
    });
  }
}
