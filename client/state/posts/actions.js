/** @format */

/**
 * External dependencies
 */
import { isNumber, map, toArray } from 'lodash';

/**
 * Internal dependencies
 */
import wpcom from 'lib/wp';
import { normalizePostForApi } from './utils';
import { getEditedPost } from 'state/posts/selectors';
import {
	POST_DELETE,
	POST_DELETE_SUCCESS,
	POST_DELETE_FAILURE,
	POST_EDIT,
	POST_REQUEST,
	POST_REQUEST_SUCCESS,
	POST_REQUEST_FAILURE,
	POST_RESTORE,
	POST_RESTORE_FAILURE,
	POST_RESTORE_SUCCESS,
	POST_SAVE,
	POST_SAVE_SUCCESS,
	POST_SAVE_FAILURE,
	POSTS_RECEIVE,
	POSTS_REQUEST,
	POSTS_REQUEST_SUCCESS,
	POSTS_REQUEST_FAILURE,
} from 'state/action-types';

/**
 * Returns an action object to be used in signalling that a post object has
 * been received.
 *
 * @param  {Object} post Post received
 * @return {Object}      Action object
 */
export function receivePost( post ) {
	return receivePosts( [ post ] );
}

/**
 * Returns an action object to be used in signalling that post objects have
 * been received.
 *
 * @param  {Array}  posts Posts received
 * @return {Object}       Action object
 */
export function receivePosts( posts ) {
	return {
		type: POSTS_RECEIVE,
		posts,
	};
}

/**
 * Triggers a network request to fetch posts for the specified site and query.
 *
 * @param  {Number}   siteId Site ID
 * @param  {String}   query  Post query
 * @return {Function}        Action thunk
 */
export function requestSitePosts( siteId, query = {} ) {
	if ( ! siteId ) {
		return null;
	}

	return requestPosts( siteId, query );
}

/**
 * Returns a function which, when invoked, triggers a network request to fetch
 * posts across all of the current user's sites for the specified query.
 *
 * @param  {String}   query Post query
 * @return {Function}       Action thunk
 */
export function requestAllSitesPosts( query = {} ) {
	return requestPosts( null, query );
}

/**
 * Triggers a network request to fetch posts for the specified site and query.
 *
 * @param  {?Number}  siteId Site ID
 * @param  {String}   query  Post query
 * @return {Function}        Action thunk
 */
function requestPosts( siteId, query = {} ) {
	return dispatch => {
		dispatch( {
			type: POSTS_REQUEST,
			siteId,
			query,
		} );

		const source = siteId ? wpcom.site( siteId ) : wpcom.me();

		return source
			.postsList( { ...query } )
			.then( ( { found, posts } ) => {
				dispatch( receivePosts( posts ) );
				dispatch( {
					type: POSTS_REQUEST_SUCCESS,
					siteId,
					query,
					found,
					posts,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: POSTS_REQUEST_FAILURE,
					siteId,
					query,
					error,
				} );
			} );
	};
}

/**
 * Triggers a network request to fetch a specific post from a site.
 *
 * @param  {Number}   siteId Site ID
 * @param  {Number}   postId Post ID
 * @return {Function}        Action thunk
 */
export function requestSitePost( siteId, postId ) {
	return dispatch => {
		dispatch( {
			type: POST_REQUEST,
			siteId,
			postId,
		} );

		return wpcom
			.site( siteId )
			.post( postId )
			.get()
			.then( post => {
				dispatch( receivePost( post ) );
				dispatch( {
					type: POST_REQUEST_SUCCESS,
					siteId,
					postId,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: POST_REQUEST_FAILURE,
					siteId,
					postId,
					error,
				} );
			} );
	};
}

/**
 * Returns an action object to be used in signalling that the specified
 * post updates should be applied to the set of edits.
 *
 * @param  {Number} siteId Site ID
 * @param  {Number} postId Post ID
 * @param  {Object} post   Post attribute updates
 * @return {Object}        Action object
 */
export function editPost( siteId, postId = null, post ) {
	return {
		type: POST_EDIT,
		post,
		siteId,
		postId,
	};
}

export function updatePostMetadata( siteId, postId = null, metaKey, metaValue ) {
	if ( typeof metaKey === 'string' ) {
		metaKey = { [ metaKey ]: metaValue };
	}

	return {
		type: POST_EDIT,
		siteId,
		postId,
		post: {
			metadata: map( metaKey, ( value, key ) => ( {
				key,
				value,
				operation: 'update',
			} ) ),
		},
	};
}

export function deletePostMetadata( siteId, postId = null, metaKeys ) {
	if ( ! Array.isArray( metaKeys ) ) {
		metaKeys = [ metaKeys ];
	}

	return {
		type: POST_EDIT,
		siteId,
		postId,
		post: {
			metadata: map( metaKeys, key => ( { key, operation: 'delete' } ) ),
		},
	};
}

/**
 * Returns an action object to be used in signalling that a post has been saved
 *
 * @param  {Number}   siteId    Site ID
 * @param  {Number}   postId    Post ID
 * @param  {Object}   savedPost Updated post
 * @param  {Object}   post      Post attributes
 * @return {Object}             Action thunk
 */
export function savePostSuccess( siteId, postId = null, savedPost, post ) {
	return {
		type: POST_SAVE_SUCCESS,
		siteId,
		postId,
		savedPost,
		post,
	};
}

/**
 * Returns an action thunk which, when dispatched, triggers a network request
 * to save the specified post object.
 *
 * @param  {Number}   siteId Site ID
 * @param  {Number}   postId Post ID
 * @param  {Object}   post   Post attributes
 * @return {Function}        Action thunk
 */
export function savePost( siteId, postId = null, post ) {
	return dispatch => {
		dispatch( {
			type: POST_SAVE,
			siteId,
			postId,
			post,
		} );

		const postHandle = wpcom.site( siteId ).post( postId );
		const normalizedPost = normalizePostForApi( post );
		const method = postId ? 'update' : 'add';
		const saveResult = postHandle[ method ]( { apiVersion: '1.2' }, normalizedPost );

		saveResult.then(
			savedPost => {
				dispatch( savePostSuccess( siteId, postId, savedPost, post ) );
				dispatch( receivePost( savedPost ) );
			},
			error => {
				dispatch( {
					type: POST_SAVE_FAILURE,
					siteId,
					postId,
					error,
				} );
			}
		);

		return saveResult;
	};
}

/**
 * Returns an action thunk which, when dispatched, triggers a network request
 * to trash the specified post.
 *
 * @param  {Number}   siteId Site ID
 * @param  {Number}   postId Post ID
 * @return {Function}        Action thunk
 */
export function trashPost( siteId, postId ) {
	return dispatch => {
		// Trashing post is almost equivalent to saving the post with status field set to `trash`
		// and the action behaves like it was doing exactly that -- it dispatches the `POST_SAVE_*`
		// actions with the right properties.
		//
		// But what we really do is to call the `wpcom.site().post().delete()` method, i.e., sending
		// a `POST /sites/:site/posts/:post/delete` request. The difference is that an explicit delete
		// will set a `_wp_trash_meta_status` meta property on the post and a later `restore` call
		// can restore the original post status, i.e., `publish`. Without this, the post will be always
		// recovered as `draft`.
		const post = { status: 'trash' };

		dispatch( {
			type: POST_SAVE,
			siteId,
			postId,
			post,
		} );

		const trashResult = wpcom
			.site( siteId )
			.post( postId )
			.delete();

		trashResult.then(
			savedPost => {
				dispatch( savePostSuccess( siteId, postId, savedPost, post ) );
				dispatch( receivePost( savedPost ) );
			},
			error => {
				dispatch( {
					type: POST_SAVE_FAILURE,
					siteId,
					postId,
					error,
				} );
			}
		);

		return trashResult;
	};
}

/**
 * Returns an action thunk which, when dispatched, triggers a network request
 * to delete the specified post. The post should already have a status of trash
 * when dispatching this action, else you should use `trashPost`.
 *
 * @param  {Number}   siteId Site ID
 * @param  {Number}   postId Post ID
 * @return {Function}        Action thunk
 */
export function deletePost( siteId, postId ) {
	return dispatch => {
		dispatch( {
			type: POST_DELETE,
			siteId,
			postId,
		} );

		const deleteResult = wpcom
			.site( siteId )
			.post( postId )
			.delete();

		deleteResult.then(
			() => {
				dispatch( {
					type: POST_DELETE_SUCCESS,
					siteId,
					postId,
				} );
			},
			error => {
				dispatch( {
					type: POST_DELETE_FAILURE,
					siteId,
					postId,
					error,
				} );
			}
		);

		return deleteResult;
	};
}

/**
 * Returns an action thunk which, when dispatched, triggers a network request
 * to restore the specified post.
 *
 * @param  {Number}   siteId Site ID
 * @param  {Number}   postId Post ID
 * @return {Function}        Action thunk
 */
export function restorePost( siteId, postId ) {
	return dispatch => {
		dispatch( {
			type: POST_RESTORE,
			siteId,
			postId,
		} );

		const restoreResult = wpcom
			.site( siteId )
			.post( postId )
			.restore();

		restoreResult.then(
			restoredPost => {
				dispatch( {
					type: POST_RESTORE_SUCCESS,
					siteId,
					postId,
				} );
				dispatch( receivePost( restoredPost ) );
			},
			error => {
				dispatch( {
					type: POST_RESTORE_FAILURE,
					siteId,
					postId,
					error,
				} );
			}
		);

		return restoreResult;
	};
}

/**
 * Returns an action thunk which, when dispatched, adds a term to the current edited post
 *
 * @param  {Number}   siteId   Site ID
 * @param  {String}   taxonomy Taxonomy Slug
 * @param  {Object}   term     Object of new term attributes
 * @param  {Number}   postId   ID of post to which term is associated
 * @return {Function}          Action thunk
 */
export function addTermForPost( siteId, taxonomy, term, postId ) {
	return ( dispatch, getState ) => {
		const state = getState();
		const post = getEditedPost( state, siteId, postId );

		// if there is no post, no term, or term is temporary, bail
		if ( ! post || ! term || ! isNumber( term.ID ) ) {
			return;
		}

		const postTerms = post.terms || {};

		// ensure we have an array since API returns an object
		const taxonomyTerms = toArray( postTerms[ taxonomy ] );
		taxonomyTerms.push( term );

		dispatch(
			editPost( siteId, postId, {
				terms: {
					[ taxonomy ]: taxonomyTerms,
				},
			} )
		);
	};
}
