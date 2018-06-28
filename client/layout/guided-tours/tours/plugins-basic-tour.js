/** @format */

/**
 * External dependencies
 */

import React, { Fragment } from 'react';
import { overEvery as and } from 'lodash';

/**
 * Internal dependencies
 */
import { makeTour, Tour, Step } from 'layout/guided-tours/config-elements';
import { isNewUser, isEnabled } from 'state/ui/guided-tours/contexts';
import { isDesktop } from 'lib/viewport';
import { getSelectedSite } from 'state/ui/selectors';
import isSiteAutomatedTransfer from 'state/selectors/is-site-automated-transfer';

const isAtomic = state => {
	const selectedSite = getSelectedSite( state );
	if ( ! selectedSite ) {
		return false;
	}

	return isSiteAutomatedTransfer( state, selectedSite.ID );
};

export const PluginsBasicTour = makeTour(
	<Tour
		name="pluginsBasicTour"
		version="20180628"
		path="/plugins/"
		when={ and( isAtomic, isDesktop, isNewUser, isEnabled( 'guided-tours/plugins-basic-tour' ) ) }
	>
		<Step
			name="init"
			arrow="left-middle"
			target=".manage_menu__plugins-extra-icon"
			placement="below"
			style={ { animationDelay: '2s', marginTop: '-89px', marginLeft: '40px' } }
			scrollContainer=".sidebar__region"
		>
			{ ( { translate } ) => (
				<Fragment>
					<p>{ translate( 'Manage plugin settings, and install more plugins here' ) }</p>
				</Fragment>
			) }
		</Step>
	</Tour>
);
