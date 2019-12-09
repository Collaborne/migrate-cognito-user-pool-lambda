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
export type CognitoEvent = UserMigrationAuthenticationEvent | UserMigrationForgotPasswordEvent;
