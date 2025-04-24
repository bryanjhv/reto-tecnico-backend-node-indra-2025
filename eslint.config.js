// @ts-check

import antfu from '@antfu/eslint-config'

export default antfu({
	formatters: true,
	stylistic: {
		indent: 'tab',
	},
	typescript: {
		tsconfigPath: 'tsconfig.json',
	},
})
