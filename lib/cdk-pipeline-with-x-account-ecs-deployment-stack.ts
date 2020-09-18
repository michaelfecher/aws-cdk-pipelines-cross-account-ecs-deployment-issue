import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import { Construct } from "@aws-cdk/core";
import { StackProps } from "@aws-cdk/core/lib/stack";
import { Stack } from "@aws-cdk/core/lib/stack";
import { Repository } from "@aws-cdk/aws-codecommit";
import {
  CodeCommitSourceAction,
  CodeCommitTrigger,
  EcrSourceAction,
  EcsDeployAction,
} from "@aws-cdk/aws-codepipeline-actions";
import * as ecr from "@aws-cdk/aws-ecr";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { TargetAccountInfraStage } from "./cross-account-infra-stage";

export class CdkPipelineWithCrossAccountEcsDeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const ecrBackendOutputArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();
    const infraSourceArtifact = new Artifact();

    const ecrBackendSourceAction = this.createEcrBackendSourceAction(
      ecrBackendOutputArtifact
    );
    const infraSourceAction = this.createCodeCommitInfraSourceAction(
      infraSourceArtifact
    );

    const sourceActionPipeline = this.createSourceActionPipeline(
      ecrBackendSourceAction,
      infraSourceAction
    );

    const cdkPipeline = this.createBasicCdkPipeline(
      cloudAssemblyArtifact,
      infraSourceArtifact,
      sourceActionPipeline
    );

    const targetAccountStage = new TargetAccountInfraStage(
      this,
      "TargetAccountInfraStage",
      {
        env: {
          account: "targetAccountId",
          region: "eu-west-1",
        },
      }
    );
    cdkPipeline.addApplicationStage(targetAccountStage);

    // SO, this is what I'd like to do on a conceptual level...
    const ecsUpdateStage = cdkPipeline.addStage("DeployBackendToCluster");
    // next line is failing with: You cannot add a dependency from 'CdkPipelineWithCrossAccountEcsDeploymentStack' (in the App) to 'CdkPipelineWithCrossAccountEcsDeploymentStack/TargetAccountInfraStage/FargateServiceStack' (in Stage 'CdkPipelineWithCrossAccountEcsDeploymentStack/TargetAccountInfraStage'): dependency cannot cross stage boundaries
    const targetAccountBackendService = targetAccountStage.backendService;
    ecsUpdateStage.addActions(
      new EcsDeployAction({
        // see TargetAccountInfraStage
        service: targetAccountBackendService,
        actionName: `DeployActionBackend`,
        input: ecrBackendOutputArtifact,
      })
    );
  }

  private createBasicCdkPipeline(
    cloudAssemblyArtifact: Artifact,
    infraSourceArtifact: Artifact,
    sourceActionPipeline: Pipeline
  ) {
    return new CdkPipeline(this, "CdkBuildDeployPipelineExtension", {
      cloudAssemblyArtifact: cloudAssemblyArtifact,
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact: infraSourceArtifact,
        cloudAssemblyArtifact,
        buildCommand: "npm run build",
      }),
      codePipeline: sourceActionPipeline,
    });
  }

  private createSourceActionPipeline(
    ecrBackendSourceAction: EcrSourceAction,
    infraSourceAction: CodeCommitSourceAction
  ): Pipeline {
    const sourceActionsCodePipeline = new Pipeline(
      this,
      "CdkPipelineMultiSourcesWithServiceDeploy",
      {
        restartExecutionOnUpdate: true,
        pipelineName: "CdkPipelineMultiSourcesWithServiceDeploy",
      }
    );

    sourceActionsCodePipeline.addStage({
      stageName: "SourceActionTriggers",
      actions: [ecrBackendSourceAction, infraSourceAction],
    });

    return sourceActionsCodePipeline;
  }

  private createEcrBackendSourceAction(
    ecrBackendOutputArtifact: Artifact
  ): EcrSourceAction {
    const backendDockerRepo = ecr.Repository.fromRepositoryName(
      this,
      "BackendContainer",
      "ReplaceMe"
    );
    return new EcrSourceAction({
      actionName: "EcrBackendUpdate",
      repository: backendDockerRepo,
      output: ecrBackendOutputArtifact,
    });
  }

  private createCodeCommitInfraSourceAction(
    infraSourceArtifact: Artifact
  ): CodeCommitSourceAction {
    const infraRepo = Repository.fromRepositoryName(
      this,
      "ImportedInfraRepo",
      "ReplaceMe"
    );

    return new CodeCommitSourceAction({
      actionName: "InfraCodeCommit",
      repository: infraRepo,
      output: infraSourceArtifact,
      trigger: CodeCommitTrigger.EVENTS,
      branch: "master",
    });
  }
}
