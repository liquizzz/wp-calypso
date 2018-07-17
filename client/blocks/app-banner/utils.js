/** @format */

/**
 * Internal dependencies
 */

import { get, includes, reduce } from 'lodash';

import getCurrentRoute from 'state/selectors/get-current-route';

export const APP_BANNER_DISMISS_TIMES_PREFERENCE = 'appBannerDismissTimes';
export const EDITOR = 'post-editor';
export const NOTES = 'notifications';
export const READER = 'reader';
export const STATS = 'stats';
export const ALLOWED_SECTIONS = [ EDITOR, NOTES, READER, STATS ];
export const ONE_WEEK_IN_MILLISECONDS = 604800000;
export const ONE_MONTH_IN_MILLISECONDS = 2419200000; // 28 days

export function getAppBannerData( translate, sectionName ) {
	switch ( sectionName ) {
		case EDITOR:
			return {
				title: translate( 'Rich mobile publishing.' ),
				copy: translate(
					'A streamlined editor with faster, simpler image uploading? Check and mate.'
				),
			};
		case NOTES:
			return {
				title: translate( 'Watch engagement happening.' ),
				copy: translate(
					'Is your new post a hit? With push notifications, see reactions as they roll in.'
				),
			};
		case READER:
			return {
				title: translate( 'Read online or off.' ),
				copy: translate( 'Catch up with new posts when you have time, even if you are offline.' ),
			};
		case STATS:
			return {
				title: translate( 'Stats at your fingertips.' ),
				copy: translate( "Add real-time stats to your device's notifications or widgets." ),
			};
		default:
			return {
				title: '',
				copy: '',
			};
	}
}

export function getCurrentSection( currentSection, isNotesOpen ) {
	if ( isNotesOpen ) {
		return NOTES;
	}

	if ( includes( ALLOWED_SECTIONS, currentSection ) ) {
		return currentSection;
	}

	return null;
}

export function getCurrentPathFragment( state ) {
	const route = getCurrentRoute( state );

	// Strip off the leading forward slash for use as a fragment
	return route.substring( 1 );
}

export function getNewDismissTimes( dismissedSection, currentDismissTimes ) {
	const currentTime = Date.now();
	const aWeekFromNow = currentTime + ONE_WEEK_IN_MILLISECONDS;
	const aMonthFromNow = currentTime + ONE_MONTH_IN_MILLISECONDS;

	return reduce(
		ALLOWED_SECTIONS,
		( result, section ) => {
			if ( section === dismissedSection ) {
				// Dismiss selected section for a month.
				result[ section ] = aMonthFromNow;
			} else {
				// Dismiss all other sections for a week, but make sure that we preserve previous dismiss time
				// if it was longer than that (e.g. if other section was also dismissed for a month).
				result[ section ] =
					get( currentDismissTimes, section, -Infinity ) > aWeekFromNow
						? get( currentDismissTimes, section )
						: aWeekFromNow;
			}

			return result;
		},
		{}
	);
}

export const isDismissed = ( dismissedUntil, section ) =>
	get( dismissedUntil, section, -Infinity ) > Date.now();
