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
