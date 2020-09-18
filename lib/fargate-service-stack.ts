import { IVpc } from "@aws-cdk/aws-ec2";
import { Repository } from "@aws-cdk/aws-ecr";
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  IBaseService,
} from "@aws-cdk/aws-ecs";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export interface FGSStackProps extends StackProps {
  cluster: Cluster;
}
export class FargateServiceStack extends Stack {
  readonly vpc: IVpc;
  readonly cluster: Cluster;
  readonly backendService: IBaseService;
  constructor(scope: Construct, id: string, props: FGSStackProps) {
    super(scope, id, props);
    const cluster = props.cluster;

    // the repo is located in the sharedAccount, but has read permissions for targetAccount
    const backendDockerRepo = Repository.fromRepositoryName(
      this,
      "BackendContainer",
      "ReplaceMe"
    );

    const taskDef = new FargateTaskDefinition(this, "BackendTask", {
      memoryLimitMiB: 8192,
      cpu: 4096,
    });

    taskDef.addContainer("BackendContainer", {
      image: ContainerImage.fromEcrRepository(backendDockerRepo),
      logging: new AwsLogDriver({
        streamPrefix: "prod/backend/ecs",
        logRetention: 3,
      }),
      environment: {
        NODE_ENV: "production",
      },
    });

    this.backendService = new FargateService(this, "BackendFargateService", {
      taskDefinition: taskDef,
      cluster: cluster,
      serviceName: "BackendFargateService",
      desiredCount: 1,
    });
  }
}
