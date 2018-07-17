/** @format */

/**
 * External dependencies
 */
import React from 'react';
import page from 'page';

/**
 * Internal Dependencies
 */
import { WordAdsUpsellComponent, PluginsUpsellComponent, StoreUpsellComponent } from './main';
import { getSiteFragment } from 'lib/route';
import {
	canCurrentUserUseStore,
	canCurrentUserUseAds,
	canAdsBeEnabledOnCurrentSite,
	canCurrentUserUpgradeSite,
} from 'state/sites/selectors';
import canCurrentUser from 'state/selectors/can-current-user';
import { getSelectedSiteId } from 'state/ui/selectors';

export default {
	storeUpsell: function( context, next ) {
		const siteFragment = getSiteFragment( context.path );
		if ( ! siteFragment ) {
			return page.redirect( '/feature/store' );
		}

		if ( canCurrentUserUseStore( context.store.getState() ) ) {
			return page.redirect( '/store/' + siteFragment );
		}

		// Render
		context.primary = React.createElement( StoreUpsellComponent );
		next();
	},

	pluginsUpsell: function( context, next ) {
		const siteFragment = getSiteFragment( context.path );
		if ( ! siteFragment ) {
			return page.redirect( '/feature/plugins' );
		}

		// Render
		context.primary = React.createElement( PluginsUpsellComponent );
		next();
	},

	wordAdsUpsell: function( context, next ) {
		const siteFragment = getSiteFragment( context.path );
		if ( ! siteFragment ) {
			return page.redirect( '/feature/ads' );
		}

		const state = context.store.getState();
		if ( ! canCurrentUserUpgradeSite( state ) ) {
			return page.redirect( '/stats/' + siteFragment );
		}

		const siteId = getSelectedSiteId( state );
		const canUserManageOptions = canCurrentUser( state, siteId, 'manage_options' );
		if ( ! canUserManageOptions ) {
			return page.redirect( '/stats/' + siteFragment );
		}

		if ( canCurrentUserUseAds( state ) ) {
			return page.redirect( '/ads/earnings/' + siteFragment );
		}

		if ( canAdsBeEnabledOnCurrentSite( state ) ) {
			return page.redirect( '/ads/settings/' + siteFragment );
		}

		// Render
		context.primary = React.createElement( WordAdsUpsellComponent );
		next();
	},
};
