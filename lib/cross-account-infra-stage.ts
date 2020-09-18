import { IVpc } from "@aws-cdk/aws-ec2";
import { IBaseService, ICluster } from "@aws-cdk/aws-ecs";
import { Construct, StackProps, Stage } from "@aws-cdk/core";
import { ClusterStack } from "./cluster-stack";
import { FargateServiceStack } from "./fargate-service-stack";
import { VpcStack } from "./vpc-stack";

export class TargetAccountInfraStage extends Stage {
  readonly vpc: IVpc;
  readonly cluster: ICluster;
  readonly backendService: IBaseService;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // create all the infra-stacks
    const vpcStack = new VpcStack(this, "FoundationVpcStack");
    const clusterStack = new ClusterStack(this, "FoundationCluster", {
      vpc: vpcStack.vpc,
    });
    const fargateServiceStack = new FargateServiceStack(
      this,
      "FargateServiceStack",
      {
        cluster: clusterStack.cluster,
      }
    );

    this.backendService = fargateServiceStack.backendService;
    this.vpc = vpcStack.vpc;
    this.cluster = clusterStack.cluster;
  }
}
