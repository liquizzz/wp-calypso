/** @format */

/**
 * External dependencies
 */
import React from 'react';
import page from 'page';

/**
 * Internal Dependencies
 */
import { PluginsUpsellComponent, StoreUpsellComponent, WordAdsUpsellComponent } from './main';
import { getSiteFragment } from 'lib/route';
import { canCurrentUserUseStore, canCurrentUserUseAds } from 'state/sites/selectors';

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

		if ( canCurrentUserUseAds( context.store.getState() ) ) {
			return page.redirect( '/ads/earnings' + siteFragment );
		}

		// Render
		context.primary = React.createElement( WordAdsUpsellComponent );
		next();
	},
};