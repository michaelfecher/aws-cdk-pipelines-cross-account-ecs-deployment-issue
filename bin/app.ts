#!/usr/bin/env node
import { App } from "@aws-cdk/core";
import { CdkPipelineWithCrossAccountEcsDeploymentStack } from "../lib/cdk-pipeline-with-x-account-ecs-deployment-stack";
const account = "sharedAccount";
const region = "eu-west-1";
const app = new App();

new CdkPipelineWithCrossAccountEcsDeploymentStack(
  app,
  "CdkPipelineWithCrossAccountEcsDeploymentStack",
  {
    env: { account: account, region: region },
  }
);

app.synth();
