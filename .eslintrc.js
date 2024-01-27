module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true
	},
	extends: 'standard',
	overrides: [
		{
			env: {
				node: true
			},
			files: [
				'.eslintrc.{js,cjs}'
			],
			parserOptions: {
				sourceType: 'script'
			}
		}
	],
	parserOptions: {
		ecmaVersion: 'latest'
	},
	rules: {
		indent: ['error', 'tab'],
		'no-tabs': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		semi: 'off',
		'no-unused-vars': 'warn',
		'no-empty': 'off',
		'padded-blocks': 'off',
		'no-trailing-spaces': 'off'
	}
}
