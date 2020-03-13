import { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
import { AdminInitiateAuthRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

import { CognitoEvent, UserMigrationAuthenticationEvent, UserMigrationForgotPasswordEvent } from './types/event';
import { LambdaContext } from './types/context';
import { LambdaCallback } from './types/callback';

/**
 * AWS region in which your User Pools are deployed
 */
const OLD_USER_POOL_REGION = process.env.OLD_USER_POOL_REGION || process.env.AWS_REGION;

/**
 * ID of the old User Pool from which you want to migrate users
 */
const OLD_USER_POOL_ID: string = process.env.OLD_USER_POOL_ID || '<OLD_USER_POOL_ID>';

/**
 * Client ID in the old User Pool from which you want to migrate users.
 */
const OLD_CLIENT_ID: string = process.env.OLD_CLIENT_ID || '<OLD_CLIENT_ID>';

interface User {
	userAttributes: {[key: string]: string | undefined};
	userName: string;
}

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
	region: OLD_USER_POOL_REGION,
});

async function authenticateUser(username: string, password: string): Promise<User | undefined> {
	console.log(`authenticateUser: user='${username}'`);

	const params: AdminInitiateAuthRequest = {
		AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
		AuthParameters: {
			PASSWORD: password,
			USERNAME: username,
		},
		ClientId: OLD_CLIENT_ID,
		UserPoolId: OLD_USER_POOL_ID,
	};
	const cognitoResponse = await cognitoIdentityServiceProvider.adminInitiateAuth(params).promise();
	const awsError: AWSError = cognitoResponse as any as AWSError;
	if (awsError.code && awsError.message) {
		console.log(`authenticateUser: error ${JSON.stringify(awsError)}`);
		return undefined;
	}
	console.log(`authenticateUser: found ${JSON.stringify(cognitoResponse)}`);

	return lookupUser(username);
}

async function lookupUser(username: string): Promise<User | undefined> {
	console.log(`lookupUser: user='${username}'`);
	const params = {
		UserPoolId: OLD_USER_POOL_ID,
		Username: username,
	};
	const cognitoResponse = await cognitoIdentityServiceProvider.adminGetUser(params).promise();
	const awsError: AWSError = cognitoResponse as any as AWSError;
	if (awsError.code && awsError.message) {
		console.log(`lookupUser: error ${JSON.stringify(awsError)}`);
		return undefined;
	}
	console.log(`lookupUser: found ${JSON.stringify(cognitoResponse)}`);

	const userAttributes = cognitoResponse.UserAttributes ? cognitoResponse.UserAttributes.reduce((acc, entry) => ({
		...acc,
		[entry.Name]: entry.Value,
	}), {} as {[key: string]: string | undefined}) : {};
	const user: User = {
		userAttributes,
		userName: cognitoResponse.Username,
	};
	console.log(`lookupUser: response ${JSON.stringify(user)}`);
	return user;
}

async function onUserMigrationAuthentication(event: UserMigrationAuthenticationEvent, context: LambdaContext, callback: LambdaCallback) {
	// authenticate the user with your existing user directory service
	const user = await authenticateUser(event.userName, event.request.password);
	if (!user) {
		// Return error to Amazon Cognito
		callback('Bad password');
		return;
	}

	event.response.userAttributes = {
		// old_username: user.userName,
		// 'custom:tenant': user.userAttributes['custom:tenant'],
		email: user.userAttributes.email,
		email_verified: 'true',
		preferred_username: user.userAttributes.preferred_username,
	};
	event.response.finalUserStatus = 'CONFIRMED';
	event.response.messageAction = 'SUPPRESS';
	context.succeed(event);

	console.log(`Authentication - response: ${JSON.stringify(event.response)}`);
}

async function onUserMigrationForgotPassword(event: UserMigrationForgotPasswordEvent, context: LambdaContext, callback: LambdaCallback) {
	// Lookup the user in your existing user directory service
	const user = await lookupUser(event.userName);
	if (!user) {
		// Return error to Amazon Cognito
		callback('Bad password');
		return;
	}

	event.response.userAttributes = {
		// old_username: user.userName,
		// 'custom:tenant': user.userAttributes['custom:tenant'],
		email: user.userAttributes.email,
		email_verified: 'true',
		preferred_username: user.userAttributes.preferred_username,
	};
	event.response.messageAction = 'SUPPRESS';

	console.log(`Forgot password - response: ${JSON.stringify(event.response)}`);

	context.succeed(event);
}

export const handler = async (event: CognitoEvent, context: LambdaContext, callback: LambdaCallback): Promise<any> => {
	switch (event.triggerSource) {
		case 'UserMigration_Authentication':
			return onUserMigrationAuthentication(event, context, callback);
		case 'UserMigration_ForgotPassword':
			return onUserMigrationForgotPassword(event, context, callback);
		default:
			// Return error to Amazon Cognito
			callback(`Bad triggerSource ${event.triggerSource}`);
	}
}
