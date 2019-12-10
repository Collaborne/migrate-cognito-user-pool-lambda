# migrate-cognito-user-pool-lambda

See this [blog post](https://medium.com/collaborne-engineering/migrate-aws-cognito-user-pools-ff2a91a745a2?sk=f91b73b84396db6f41a294f54bfeb2db) for a description

## Usage

Follow these steps to use the migration Lambda function:

1. Adjust the constants for `AWS_REGION`, `OLD_USER_POOL_ID`, and `OLD_CLIENT_ID` in [index.ts](src/index.ts).

2. Enable OAuth flow `ALLOW_ADMIN_USER_PASSWORD_AUTH` for the client of the old User Pool

3. Enable OAuth flow `ALLOW_USER_PASSWORD_AUTH` for the client of new User Pool

4. Create in Lambda function in the AWS console

5. Grant to the Lambda function the permission to execute action `Allow: cognito-idp:AdminGetUser` and `Allow: cognito-idp:AdminInitiateAuth`

6. Configure the trigger _User Migration_ for the new User Pool to call the migration lambda function
