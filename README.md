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

4. Create in Lambda function in the AWS console

   * Grant the permission to execute action `Allow: cognito-idp:AdminGetUser` and `Allow: cognito-idp:AdminInitiateAuth`
   * Configure the `OLD_USER_POOL_REGION`, `OLD_USER_POOL_ID`, and `OLD_CLIENT_ID` environment variables

5. Configure the trigger _User Migration_ for the new User Pool to call the migration lambda function
