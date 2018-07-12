/** @format */

import Button from 'components/button';
import { registerHandlers } from 'state/data-layer/handler-loaders';

export default () => {
	registerHandlers( 'hello-dolly', {} );

	wp.blocks.registerBlockType( 'hello-dolly', {
		title: 'Hello Dolly',
		icon: 'format-audio',
		category: 'layout',
		edit: () => (
			<p>
				Hello, Dolly! <Button>Click Me</Button>
			</p>
		),
		save: () => <p>Hello, Dolly!</p>,
	} );
};
