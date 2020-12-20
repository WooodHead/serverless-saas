In this repo we will take a simple To Do App single tenant SaaS and updated it to multi-tenant architecture using different technologies. All steps should use CDK. The client will be a React SPA.

Before Starting Review these:

[AWS Sample Labs Starting from Lab 1](https://github.com/aws-samples/aws-serverless-saas-layers/blob/master/Lab1/README.md)

[Solution code for Labs](https://github.com/aws-samples/aws-serverless-saas-layers/tree/master/Solution)

step00_todo_single_tenant_serverless

We will build a single tenant serverless Todo SaaS app with AWS Serverless REST backend and a React front end. There will be no signin for the app.

step01_todo_single_tenant_auth

We will extend step 00 by adding Cognito authentication. It will still be a single tenant solution.

step02_todo_multi_tenant

This step will build on the previous step and implement multi-tenancy in the todo app. Each user will first signup and then signin. Each user can create multiple todo lists. Each list will be unique in the service, so that multiple users can have access to the same list, in the next step. This means that list's unique ID is basically the tenant ID. We will use a single DynamoDB table to store all the todo lists i.e. we will do data partitioning using Pool model (See AWS Lab 4)

step03_todo_multi_tenant_multi_user

The owner of the todo list will be able to given access to other users to a todo list.

step04_todo_multi_tenant_metrices

In this step we want to collect metrices about each and every todo list i.e. the tenant. This will allow us to figure out how much resources each todo list (tenant) is consuming, thus track the resource consumtion to owners of the todo lists.

In order to track tenant metrices Cognito tokens with embeded todo list id (tenant id).  Think of the cognito token (JWT) as a JSON object with Tenant ID as one of the attributes. When we will use this token to call any service it will know who the tenant is, so that we can meter it. In AWS Lab 3 it is shown how to extract tenant ID from the tokens. 

https://aws.amazon.com/blogs/mobile/building-fine-grained-authorization-using-amazon-cognito-user-pools-groups/

https://www.npmjs.com/package/amazon-cognito-identity-js 

https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html

https://stackoverflow.com/questions/49063292/how-to-generate-access-token-for-an-aws-cognito-user 

https://github.com/sandylib/aws-cognito-token-generator

https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html

https://stackoverflow.com/questions/50574425/get-cognito-user-pool-identity-in-lambda-function

https://stackoverflow.com/questions/51507326/how-do-i-get-a-cognito-token-within-a-lambda-function


step05_todo_multi_tenant_silo_model

In this step we will partition the data by tenant using FaunaDB multi-tenant features.

[Multi-tenancy Docs](https://docs.fauna.com/fauna/current/tutorials/multitenant.html)

[Learning FQL, Part 3: Database Access Keys](https://fauna.com/blog/learning-fql-part-3-database-access-keys)

[Fauna Serverless Scheduling: Cooperative Scheduling with QoS](https://fauna.com/blog/serverless-scheduling-with-qos-based-multi-tenancy)

[Create a collection in a specific child database](https://stackoverflow.com/questions/60840892/create-a-collection-in-a-specific-child-database)

[Secure Hierarchical Multi-tenancy Patterns](https://www.colabug.com/2018/0508/2864552/)

step06_todo_multi_tenant_event_driven_arch

https://github.com/panacloud-modern-global-apps/full-stack-serverless-cdk#event-driven-architecture

https://github.com/panacloud-modern-global-apps/full-stack-serverless-cdk/tree/main/step34_event-driven-restaurant-app


step07_todo_multi_tenant_lambda_containers

https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/

