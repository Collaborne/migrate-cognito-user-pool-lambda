# migrate-cognito-user-pool-lambda

See this [blog post](https://medium.com/collaborne-engineering/migrate-aws-cognito-user-pools-ff2a91a745a2?sk=f91b73b84396db6f41a294f54bfeb2db) for a description

## Usage

Follow these steps to use the migration Lambda function:

1. Create a new user pool client in the old user pool
   This client must have the OAuth flow `ALLOW_ADMIN_USER_PASSWORD_AUTH` enabled.

2. Configure all clients in the new user pool that are allowed to trigger user migration
   These clients must use the OAuth flow `USER_PASSWORD_AUTH`.

3. Build the lambda source code

   ```bash
   npm install && npm run build
   ```

4. Create in Lambda function in the AWS console in the same account as the new user pool

   * Configure the `OLD_USER_POOL_REGION`, `OLD_USER_POOL_ID`, and `OLD_CLIENT_ID` environment variables
   * Grant the required permissions for accessing the user pool

     If the old user pool is in the same AWS account: `Allow` the actions `cognito-idp:AdminGetUser` and `cognito-idp:AdminInitiateAuth` in the execution role of the lambda function

     If the old user pool is in a different AWS account:

     1. Create a role in the account that owns the user pool that `Allow`s the `cognito-idp:AdminGetUser` and `cognito-idp:AdminInitiateAuth` actions and that trusts the execution role of the lambda function
     2. `Allow` the action `sts:AssumeRole` for the ARN of the created role in the execution role of the lambda function
     3. Configure the `OLD_ROLE_ARN` and `OLD_EXTERNAL_ID` environment variables for the lambda function

5. Configure the trigger _User Migration_ for the new User Pool to call the migration lambda function


## Using AWS CLI

If you wish to use [AWS CLI](https://docs.aws.amazon.com/cli/latest/)
This reduces the need to navigate around AWS Console which is always in flux and not the easiest to figure out.
Ensure that in cognito > new user pool > App Clients > Client being used for login
that Security configuration > Prevent User Existence Errors is set to legacy recommended https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-managing-errors.html

This kicks in the lambda workflow that allows the migration lambda function to execute when a login failure occurs.
Without this, the lambda function will not get called and will not execute.


Maintain a txt list of the following variables as you work your way through this
* `OLD_USER_POOL_ID` - the pool id you are migrating *from* (us-east-2_xyzABC)
* `OLD_USER_POOL_ARN` - the pool Arn you are migrating *from* (arn:aws:cognito-idp:us-east-2:12345:userpool/us-east-2_xyzABC)
* `OLD_USER_POOL_REGION` - the region that pool is located in (us-east-1 or us-east-2 etc...)
* `NEW_USER_POOL_ID` - the pool you are migrating *to* (us-east-2_xyzDEF)
* `ROLE_ARN` (created in step 1)
* `POLICY_ARN` (created in step 2)
* `OLD_CLIENT_ID` (created in step 4)
* `LAMBDA_ARN` (created in step 5)

1. Create Role
   * Update the role name to match your DevOps procedures
   * Note the Arn returned from this as it will be your `ROLE_ARN`

```bash
   aws iam create-role --role-name cognito-migration-lambda-xxxx \
                       --assume-role-policy-document file://trust-policy.json
```

2. Create Permissions for your lambda function to run
   * Update lambda-role-policy.json to the ARN of the *OLD* cognito user-pool (the one your migrating from)
   * "Resource": "arn:aws:cognito-idp:XXXXXXXXXXX" -> `OLD_USER_POOL_ARN`
   * Name your policy to match your DevOps procedures "cognito-migration-lambda-policy-xxxx"

```bash
   aws iam create-policy --policy-name cognito-migration-lambda-policy-xxxx \
                         --policy-document file://lambda-role-policy.json
```
This allows your lambda function to authenticate and look up users against the old cognito instance
Note the Arn returned from the command `POLICY_ARN`


3. Attach Permissions to role
   * Update role names to match your DevOps procedures

```bash
   # Standard lambda execution policy, including cloud logging
   aws iam attach-role-policy --role-name cognito-migration-lambda-xxxxx \
                              --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

   # Attach the policy you just created in step 2
   aws iam attach-role-policy --role-name cognito-migration-lambda-xxxxx \
                              --policy-arn POLICY_ARN
```

4. Create user pool client in old user pool
   * Update user-pool-id with the ID of the *OLD* user pool
   * This is the client that the lambda function will connect to validate user / passwords with
   * Note the ClientId returned from this as it will be your `OLD_CLIENT_ID`

```bash
   aws cognito-idp create-user-pool-client \
      --user-pool-id XXXXXXXX \
      --client-name lambda-migration-client \
      --no-generate-secret \
      --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_ADMIN_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH"
```

5. Create lambda function
   * Edit lambda-skeleton.json
     * Update 
       * "FunctionName": "test-migration-cognitio"
       * "Role": "`ROLE_ARN`" 
       * "OLD_CLIENT_ID": "XXX",
       * "OLD_USER_POOL_ID": "XXX",
       * "OLD_USER_POOL_REGION": "XXX"
   * Build the function code
```bash
   npm install && npm run build
``` 
   * Deploy it
     * Note the Arn returned from this, this is your `LAMBDA_ARN`
```bash
   aws lambda create-function --cli-input-json file://lambda-skeleton.json --zip-file fileb://migrate-cognito-user-pool.zip 
```

6. Attach lambda to new user pool
   * This is where you hook up your lambda function to your new cognito instance
   * Update the `NEW_USER_POOL_ID` and `LAMBDA_ARN`

```bash
   aws cognito-idp update-user-pool \
  --user-pool-id NEW_USER_POOL_ID \
  --lambda-config  UserMigration=LAMBDA_ARN
```

