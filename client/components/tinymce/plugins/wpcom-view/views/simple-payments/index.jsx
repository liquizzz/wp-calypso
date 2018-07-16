/** @format **/
/* eslint-disable wpcalypso/jsx-classname-namespace */
/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { next } from 'lib/shortcode';
import Notice from 'components/notice';
import { deserialize } from 'components/tinymce/plugins/simple-payments/shortcode-utils';
import canCurrentUser from 'state/selectors/can-current-user';
import getMediaItem from 'state/selectors/get-media-item';
import getSimplePayments from 'state/selectors/get-simple-payments';
import { hasFeature } from 'state/sites/plans/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';
import formatCurrency from 'lib/format-currency';
import QuerySimplePayments from 'components/data/query-simple-payments';
import QueryMedia from 'components/data/query-media';
import { FEATURE_SIMPLE_PAYMENTS } from 'lib/plans/constants';

class SimplePaymentsView extends Component {
	render() {
		const { translate, productId, product, siteId, planHasFeature, canManageSite } = this.props;

		if ( ! product ) {
			return <QuerySimplePayments siteId={ siteId } productId={ productId } />;
		}

		const { productImage } = this.props;
		const {
			title,
			description,
			price,
			currency,
			multiple,
			featuredImageId: productImageId,
		} = product;

		return (
			<div className="wpview-content wpview-type-simple-payments">
				{ productImageId && <QueryMedia siteId={ siteId } mediaId={ productImageId } /> }
				{ ! planHasFeature &&
					canManageSite && (
						<Notice status="is-error" showDismiss={ false }>
							{ translate( 'Simple Payments is not supported by your current Plan.' ) }
						</Notice>
					) }
				<div className="wpview-type-simple-payments__wrapper">
					{ productImage && (
						<div className="wpview-type-simple-payments__image-part">
							<figure className="wpview-type-simple-payments__image-figure">
								<img className="wpview-type-simple-payments__image" src={ productImage.URL } />
							</figure>
						</div>
					) }
					<div className="wpview-type-simple-payments__text-part">
						<div className="wpview-type-simple-payments__title">{ title }</div>
						<div className="wpview-type-simple-payments__description">{ description }</div>
						<div className="wpview-type-simple-payments__price-part">
							{ formatCurrency( price, currency ) }
						</div>
						<div className="wpview-type-simple-payments__pay-part">
							{ multiple && (
								<div className="wpview-type-simple-payments__pay-quantity">
									<input
										className="wpview-type-simple-payments__pay-quantity-input"
										type="text"
										value="1"
										readOnly
									/>
								</div>
							) }
							<div className="wpview-type-simple-payments__pay-paypal-button-wrapper">
								<div className="wpview-type-simple-payments__pay-paypal-button-content">
									<span className="wpview-type-simple-payments__pay-paypal-button-text">
										{ translate( 'Pay with' ) }
									</span>
									<span className="wpview-type-simple-payments_paypal-logo" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

SimplePaymentsView = connect( ( state, props ) => {
	const { content: shortcode } = props;

	const shortcodeData = deserialize( shortcode );

	const { id: productId = null } = shortcodeData;
	const siteId = getSelectedSiteId( state );
	const product = getSimplePayments( state, siteId, productId );

	return {
		shortcodeData,
		productId,
		siteId,
		product,
		productImage: getMediaItem( state, siteId, get( product, 'featuredImageId' ) ),
		planHasFeature: hasFeature( state, siteId, FEATURE_SIMPLE_PAYMENTS ),
		canManageSite: canCurrentUser( state, siteId, 'manage_options' ),
	};
} )( localize( SimplePaymentsView ) );

SimplePaymentsView.match = content => {
	const match = next( 'simple-payment', content );

	if ( match ) {
		return {
			index: match.index,
			content: match.content,
			options: {
				shortcode: match.shortcode,
			},
		};
	}
};

SimplePaymentsView.serialize = content => {
	return encodeURIComponent( content );
};

SimplePaymentsView.edit = ( editor, content ) => {
	editor.execCommand( 'simplePaymentsButton', content );
};

export default SimplePaymentsView;
