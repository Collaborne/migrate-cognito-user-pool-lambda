interface BaseCognitoEvent {
	triggerSource: string;
	response: {
		userAttributes: {[key: string]: string | undefined};
		finalUserStatus: 'CONFIRMED';
		messageAction: 'SUPPRESS';
	}
}
export interface UserMigrationAuthenticationEvent extends BaseCognitoEvent {
	userName: string;
	request: {
		password: string;
	};
}
export interface UserMigrationForgotPasswordEvent extends BaseCognitoEvent {
	userName: string;
	request: {
		password: string;
	};
}

/**
 * See {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-migrate-user.html#cognito-user-pools-lambda-trigger-syntax-user-migration Migrate User Lambda Trigger Parameters}
 */
export type CognitoEvent = UserMigrationAuthenticationEvent | UserMigrationForgotPasswordEvent;
