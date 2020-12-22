#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Step01TodoSingleTenantAuthStack } from '../lib/step01_todo_single_tenant_auth-stack';

const app = new cdk.App();
new Step01TodoSingleTenantAuthStack(app, 'Step01TodoSingleTenantAuthStack');
