/** @format */

import Button from 'components/button';

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
