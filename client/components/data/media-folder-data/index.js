/** @format */

/**
 * External dependencies
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import MediaFolderStore from 'lib/media/folder-store';
import MediaActions from 'lib/media/actions';

function getStateData( siteId ) {
	return {
		folders: MediaFolderStore.getAll( siteId ),
	};
}

export default class extends React.Component {
	static displayName = 'MediaFolderData';

	static propTypes = {
		siteId: PropTypes.number.isRequired,
	};

	state = getStateData( this.props.siteId );

	componentDidMount() {
		MediaFolderStore.on( 'change', this.updateState );
		// Must come after we subscribe to changes
		MediaActions.fetchFolders( this.props.siteId );
	}

	componentWillUnmount() {
		MediaFolderStore.off( 'change', this.updateState );
	}

	updateState = () => {
		this.setState( getStateData( this.props.siteId ) );
	};

	render() {
		const props = {
			...this.state,
			fetchFolders: this.updateState, // allow children to request folders
		};

		// Render prop
		// https://reactjs.org/docs/render-props.html
		return this.props.render( props );
	}
}
