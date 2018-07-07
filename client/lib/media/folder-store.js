/** @format */

/**
 * External dependencies
 */

import { assign, isEqual, omit } from 'lodash';

/**
 * Internal dependencies
 */
import Dispatcher from 'dispatcher';
import MediaStore from './store';
import emitter from 'lib/mixins/emitter';

/**
 * Module variables
 */
const MediaFolderStore = {
		_activeQueries: {},
		DEFAULT_QUERY: Object.freeze( { number: 20 } ),
		_folders: {},
	},
	DEFAULT_ACTIVE_QUERY = Object.freeze( { isFetchingNextPage: false } ),
	SAME_QUERY_IGNORE_PARAMS = Object.freeze( [ 'number', 'page_handle' ] );

emitter( MediaFolderStore );

function clearSite( siteId ) {
	delete MediaFolderStore._folders[ siteId ];
	delete MediaFolderStore._activeQueries[ siteId ].nextPageHandle;
	MediaFolderStore._activeQueries[ siteId ].isFetchingNextPage = false;
}

function updateActiveQuery( siteId, query ) {
	query = omit( query, 'page_handle' );
	MediaFolderStore.ensureActiveQueryForSiteId( siteId );

	if ( ! isQuerySame( siteId, query ) ) {
		clearSite( siteId );
	}

	MediaFolderStore._activeQueries[ siteId ].query = query;
}

function updateActiveQueryStatus( siteId, status ) {
	MediaFolderStore.ensureActiveQueryForSiteId( siteId );
	assign( MediaFolderStore._activeQueries[ siteId ], status );
}

function isQuerySame( siteId, query ) {
	if ( ! ( siteId in MediaFolderStore._activeQueries ) ) {
		return false;
	}

	return isEqual(
		omit( query, SAME_QUERY_IGNORE_PARAMS ),
		omit( MediaFolderStore._activeQueries[ siteId ].query, SAME_QUERY_IGNORE_PARAMS )
	);
}

function ensureFoldersForSiteId( siteId ) {
	if ( ! ( siteId in MediaFolderStore._folders ) ) {
		MediaFolderStore._folders[ siteId ] = [];
	}
}

function receiveFolder( siteId, item ) {
	ensureFoldersForSiteId( siteId );

	if (
		-1 === MediaFolderStore._folders[ siteId ].indexOf( item.ID ) &&
		MediaFolderStore.isItemMatchingQuery( siteId, item )
	) {
		MediaFolderStore._folders[ siteId ].push( item );
	}
}

function receiveFolders( siteId, folders ) {
	ensureFoldersForSiteId( siteId );

	folders.forEach( function( folder ) {
		receiveFolder( siteId, folder );
	} );
}

MediaFolderStore.isItemMatchingQuery = function() {
	return true;
};

MediaFolderStore.getAll = function( siteId ) {
	return MediaFolderStore._folders[ siteId ];
};

MediaFolderStore.getQuery = function( siteId ) {
	if ( ! ( siteId in MediaFolderStore._activeQueries ) ) {
		return MediaFolderStore.DEFAULT_QUERY;
	}

	return assign(
		{},
		MediaFolderStore.DEFAULT_QUERY,
		{
			page_handle: MediaFolderStore._activeQueries[ siteId ].nextPageHandle,
		},
		MediaFolderStore._activeQueries[ siteId ].query
	);
};

// MediaFolderStore.hasNextPage = function( siteId ) {
// 	return (
// 		! ( siteId in MediaFolderStore._activeQueries ) ||
// 		null !== MediaFolderStore._activeQueries[ siteId ].nextPageHandle
// 	);
// };

MediaFolderStore.ensureActiveQueryForSiteId = function( siteId ) {
	if ( ! ( siteId in MediaFolderStore._activeQueries ) ) {
		MediaFolderStore._activeQueries[ siteId ] = assign( {}, DEFAULT_ACTIVE_QUERY );
	}
};

MediaFolderStore.isFetchingNextPage = function( siteId ) {
	return (
		siteId in MediaFolderStore._activeQueries &&
		MediaFolderStore._activeQueries[ siteId ].isFetchingNextPage
	);
};

MediaFolderStore.dispatchToken = Dispatcher.register( function( payload ) {
	const action = payload.action;

	Dispatcher.waitFor( [ MediaStore.dispatchToken ] );

	switch ( action.type ) {
		case 'SET_MEDIA_FOLDERS_QUERY':
			if ( action.siteId && action.query ) {
				updateActiveQuery( action.siteId, action.query );
			}

			break;

		case 'FETCH_MEDIA_FOLDERS':
			if ( ! action.siteId ) {
				break;
			}

			updateActiveQueryStatus( action.siteId, {
				isFetchingNextPage: true,
			} );

			MediaFolderStore.emit( 'change' );
			break;

		case 'RECEIVE_MEDIA_FOLDERS':
			if ( ! action.siteId ) {
				break;
			}

			updateActiveQueryStatus( action.siteId, {
				isFetchingNextPage: false,
				//nextPageHandle: getNextPageMetaFromResponse( action.data ),
			} );

			if (
				action.error ||
				! action.data ||
				( action.query && ! isQuerySame( action.siteId, action.query ) )
			) {
				break;
			}

			receiveFolders( action.siteId, action.data.folders );

			MediaFolderStore.emit( 'change' );
			break;
	}
} );

export default MediaFolderStore;
