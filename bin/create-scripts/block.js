/** @format */
const path = require( 'path' );
const webpack = require( 'webpack' );

const __rootDir = path.resolve( __dirname, '../../' );
const entryPath = path.resolve( process.argv[ 2 ] );
const sourceDir = path.dirname( entryPath );
const outputDir = path.join( sourceDir, 'build' );
const blockName = path.basename( path.dirname( entryPath ) );

const baseConfig = require( path.join( __rootDir, 'webpack.config.js' ) );

const config = {
	...baseConfig,
	...{
		mode: 'production',
		entry: entryPath,
		externals: {
			...baseConfig.externals,
			wp: 'wp',
		},
		optimization: {
			splitChunks: false,
		},
		output: {
			path: outputDir,
			filename: `blocks-${ blockName }.js`,
			libraryTarget: 'window',
			library: `blocks-${ blockName }`,
		},
		module: {
			...baseConfig.module,
			rules: [
				...baseConfig.module.rules,
				{
					test: /\.scss$/,
					use: [
						'style-loader',
						'css-loader',
						{
							loader: 'sass-loader',
							options: {
								includePaths: [
									path.join( __rootDir, 'assets', 'stylesheets' ),
									path.join( __rootDir, 'assets', 'stylesheets', 'shared' ),
									path.join( __rootDir, 'assets', 'stylesheets', 'shared', 'mixins' ),
								],
							},
						},
					],
				},
			],
		},
	},
};

const compiler = webpack( config );

compiler.run( ( error, stats ) => console.log( stats.toString() ) );
