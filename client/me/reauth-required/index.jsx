/** @format */

/**
 * External dependencies
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import debugFactory from 'debug';
const debug = debugFactory( 'calypso:me:reauth-required' );

/**
 * Internal Dependencies
 */
import Dialog from 'components/dialog';
import FormFieldset from 'components/forms/form-fieldset';
import FormLabel from 'components/forms/form-label';
import FormTelInput from 'components/forms/form-tel-input';
import FormCheckbox from 'components/forms/form-checkbox';
import FormButton from 'components/forms/form-button';
import FormButtonsBar from 'components/forms/form-buttons-bar';
import FormInputValidation from 'components/forms/form-input-validation';
/* eslint-enable no-restricted-imports */
import userUtilities from 'lib/user/utils';
import constants from 'me/constants';
import Notice from 'components/notice';
import { recordGoogleEvent } from 'state/analytics/actions';

import {
	isReauthRequired,
	isTwoStepSMSEnabled,
	isSMSResendThrottled,
	isCodeValidationFailed,
	getSMSLastFour,
	isCodeValidationInProgress,
} from 'state/two-step/selectors';

import {
	requestTwoStep,
	validateCode,
	sendSMSValidationCode,
	getAppAuthCodes,
} from 'state/two-step/actions';

class ReauthRequired extends React.Component {
	static propTypes = {
		recordGoogleEvent: PropTypes.func.isRequired,
		requestTwoStep: PropTypes.func.isRequired,
		validateCode: PropTypes.func.isRequired,
		sendSMSValidationCode: PropTypes.func.isRequired,
		getAppAuthCodes: PropTypes.func.isRequired,

		isReauthRequired: PropTypes.bool.isRequired,
		isTwoStepSMSEnabled: PropTypes.bool.isRequired,
		isCodeValidationFailed: PropTypes.bool.isRequired,
		isSMSResendThrottled: PropTypes.bool.isRequired,
		isCodeValidationInProgress: PropTypes.bool.isRequired,
		SMSLastFour: PropTypes.string,
	};

	constructor( props ) {
		super();

		this.state = {
			remember2fa: false, // Should the 2fa be remembered for 30 days?
			code: '', // User's generated 2fa code
			smsRequestsAllowed: true, // Can the user request another SMS code?
			smsCodeSent: false,
		};

		props.requestTwoStep();
	}

	getClickHandler( action, callback ) {
		return () => {
			this.props.recordGoogleEvent( 'Me', 'Clicked on ' + action );

			if ( callback ) {
				callback();
			}
		};
	}

	getCheckboxHandler( checkboxName ) {
		return event => {
			const action = 'Clicked ' + checkboxName + ' checkbox';
			const value = event.target.checked ? 1 : 0;

			this.props.recordGoogleEvent( 'Me', action, 'checked', value );
		};
	}

	getFocusHandler( action ) {
		return () => this.props.recordGoogleEvent( 'Me', 'Focused on ' + action );
	}

	getCodeMessage = () => {
		let codeMessage = '';

		if ( this.props.isTwoStepSMSEnabled ) {
			codeMessage = this.props.translate(
				'Press the button below to request an SMS verification code. ' +
					'Once you receive our text message at your phone number ending with ' +
					'{{strong}}%(smsLastFour)s{{/strong}} , enter the code below.',
				{
					args: {
						smsLastFour: this.props.SMSLastFour,
					},
					components: {
						strong: <strong />,
					},
				}
			);
		} else {
			codeMessage = this.props.translate(
				'Please enter the verification code generated by your authenticator app.'
			);
		}

		return codeMessage;
	};

	submitForm = event => {
		event.preventDefault();

		this.props.validateCode( this.state.code, this.state.remember2fa );
	};

	codeRequestTimer = false;

	allowSMSRequests = () => {
		this.setState( { smsRequestsAllowed: true } );
	};

	sendSMSCode = () => {
		this.setState( { smsRequestsAllowed: false, smsCodeSent: true } );
		this.codeRequestTimer = setTimeout( this.allowSMSRequests, 60000 );

		this.props.sendSMSValidationCode();
	};

	preValidateAuthCode = () => {
		return this.state.code.length && this.state.code.length > 5;
	};

	renderSendSMSButton() {
		const { smsRequestsAllowed, smsCodeSent } = this.state;

		const [ clickAction, buttonLabel ] = ! smsCodeSent
			? [ 'Send SMS Code Button on Reauth Required', this.props.translate( 'Send SMS Code' ) ]
			: [ 'Resend SMS Code Button on Reauth Required', this.props.translate( 'Resend SMS Code' ) ];

		return (
			<FormButton
				disabled={ ! smsRequestsAllowed }
				isPrimary={ false }
				onClick={ this.getClickHandler( clickAction, this.sendSMSCode ) }
				type="button"
			>
				{ buttonLabel }
			</FormButton>
		);
	}

	renderFailedValidationMsg() {
		if ( ! this.props.isCodeValidationFailed ) {
			return null;
		}

		return (
			<FormInputValidation
				isError
				text={ this.props.translate( 'You entered an invalid code. Please try again.' ) }
			/>
		);
	}

	renderSMSResendThrottled() {
		if ( ! this.props.isSMSResendThrottled ) {
			return null;
		}

		return (
			<div className="reauth-required__send-sms-throttled">
				<Notice
					showDismiss={ false }
					text={ this.props.translate(
						'SMS codes are limited to once per minute. Please wait and try again.'
					) }
				/>
			</div>
		);
	}

	render() {
		const codePlaceholder = this.props.isTwoStepSMSEnabled
			? constants.sevenDigit2faPlaceholder
			: constants.sixDigit2faPlaceholder;

		return (
			<Dialog
				autoFocus={ false }
				className="reauth-required__dialog"
				isFullScreen={ false }
				isVisible={ this.props.isReauthRequired }
				buttons={ null }
				onClose={ null }
			>
				<p>{ this.getCodeMessage() }</p>

				<p>
					<a
						className="reauth-required__sign-out"
						onClick={ this.getClickHandler( 'Reauth Required Log Out Link', userUtilities.logout ) }
					>
						{ this.props.translate( 'Not you? Sign Out' ) }
					</a>
				</p>

				<form onSubmit={ this.submitForm }>
					<FormFieldset>
						<FormLabel htmlFor="code">{ this.props.translate( 'Verification Code' ) }</FormLabel>
						<FormTelInput
							autoFocus={ true }
							id="code"
							isError={ this.props.isCodeValidationFailed }
							name="code"
							placeholder={ codePlaceholder }
							onFocus={ this.getFocusHandler( 'Reauth Required Verification Code Field' ) }
							value={ this.state.code }
							onChange={ this.handleChange }
						/>

						{ this.renderFailedValidationMsg() }
					</FormFieldset>

					<FormFieldset>
						<FormLabel>
							<FormCheckbox
								id="remember2fa"
								name="remember2fa"
								onClick={ this.getCheckboxHandler( 'Remember 2fa' ) }
								checked={ this.state.remember2fa }
								onChange={ this.handleCheckedChange }
							/>
							<span>{ this.props.translate( 'Remember for 30 days.' ) }</span>
						</FormLabel>
					</FormFieldset>

					{ this.renderSMSResendThrottled() }

					<FormButtonsBar>
						<FormButton
							disabled={ this.props.isCodeValidationInProgress || ! this.preValidateAuthCode() }
							onClick={ this.getClickHandler( 'Submit Validation Code on Reauth Required' ) }
						>
							{ this.props.translate( 'Verify' ) }
						</FormButton>

						{ this.renderSendSMSButton() }
					</FormButtonsBar>
				</form>
			</Dialog>
		);
	}

	handleChange = e => {
		const { name, value } = e.currentTarget;
		this.setState( { [ name ]: value } );
	};

	handleCheckedChange = e => {
		const { name, checked } = e.currentTarget;
		this.setState( { [ name ]: checked } );
	};
}

export default connect(
	state => ( {
		isReauthRequired: isReauthRequired( state ),
		isTwoStepSMSEnabled: isTwoStepSMSEnabled( state ),
		isCodeValidationFailed: isCodeValidationFailed( state ),
		isSMSResendThrottled: isSMSResendThrottled( state ),
		SMSLastFour: getSMSLastFour( state ),
		isCodeValidationInProgress: isCodeValidationInProgress( state ),
	} ),
	{
		recordGoogleEvent,
		requestTwoStep,
		validateCode,
		sendSMSValidationCode,
		getAppAuthCodes,
	}
)( localize( ReauthRequired ) );
