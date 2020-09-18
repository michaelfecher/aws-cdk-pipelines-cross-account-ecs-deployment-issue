import { IVpc } from "@aws-cdk/aws-ec2";
import { Cluster } from "@aws-cdk/aws-ecs";
import { Construct, Stack, StackProps } from "@aws-cdk/core";
export interface ClusterStackProps extends StackProps {
  vpc: IVpc;
}
export class ClusterStack extends Stack {
  readonly vpc: IVpc;
  readonly cluster: Cluster;
  constructor(scope: Construct, id: string, props: ClusterStackProps) {
    super(scope, id, props);
    const vpc = props.vpc;

    this.cluster = new Cluster(this, "ApplicationCluster", {
      vpc: vpc,
      clusterName: "ApplicationCluster",
      containerInsights: true,
    });
  }
}
