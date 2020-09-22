import { EcsDeployAction } from "@aws-cdk/aws-codepipeline-actions";
import { Vpc } from "@aws-cdk/aws-ec2";
import { Cluster, FargateService, IBaseService } from "@aws-cdk/aws-ecs";
import { Construct, Stack, StackProps } from "@aws-cdk/core";

export interface ImportedClusterResourcesProps extends StackProps {
  stage: string;
  projectName: string;
}
/**
 * Those resources are deployed on the target account and needed to be reused in the cdk-pipeline*
 *
 */
export class ImportedClusterResourcesStack extends Stack {
  readonly fargateServiceAction: EcsDeployAction;
  readonly fargateService: IBaseService;

  constructor(
    scope: Construct,
    id: string,
    props: ImportedClusterResourcesProps
  ) {
    super(scope, id, props);
    const stage = props.stage;
    const projectName = props.projectName;

    // Both approaches failed (either lookup with vpcId or by tagged name)

    const vpcId = this.node.tryGetContext("vpcid");
    const importedVpc = Vpc.fromLookup(this, `${stage}ImportedVpc`, {
      vpcId,
    });

    //     // projectName: ProjectXYZ, which is also tagged on the VPC itself
    // const importedVpc = Vpc.fromLookup(this, `${stage}ImportedVpc`, {
    //   tags: {
    //     name: `${projectName}Vpc`,
    //   },
    // });

    const importedCluster = Cluster.fromClusterAttributes(
      this,
      `${stage}ImportedCluster`,
      {
        clusterName: `${projectName}ApplicationsCluster`,
        vpc: importedVpc,
        securityGroups: [],
      }
    );

    this.fargateService = FargateService.fromFargateServiceAttributes(
      this,
      `${stage}ImportedBackendService`,
      {
        cluster: importedCluster,
        serviceName: `${projectName}BackendFargateService`,
      }
    );
  }
}
