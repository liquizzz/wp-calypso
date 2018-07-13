/** @format */
/**
 * Internal dependencies
 */
import Badge from 'components/badge';
import Button from 'components/button';
import Notice from 'components/notice';

import 'components/badge/style.scss';
import 'components/button/style.scss';
import 'components/notice/style.scss';

const { InspectorControls } = wp.editor;

wp.blocks.registerBlockType( 'calypsoberg/hello-dolly', {
	title: 'Hello Dolly',
	icon: 'format-audio',
	category: 'layout',
	edit: ( { isSelected } ) => (
		<>
			<p>Hello, Dolly!</p>
			{ isSelected ? (
				<Button primary>Click Me!</Button>
			) : (
				<Badge type="success">You did it!</Badge>
			) }
			{ isSelected && (
				<InspectorControls>
					<Notice status="is-info" icon="gift">
						Welcome to Calytenberg
					</Notice>
					<p>You have configured.</p>
				</InspectorControls>
			) }
		</>
	),
	save: () => <p>Hello, Dolly!</p>,
} );
