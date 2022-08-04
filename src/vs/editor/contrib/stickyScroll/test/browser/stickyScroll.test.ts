/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { withAsyncTestCodeEditor } from 'vs/editor/test/browser/testCodeEditor';

suite('StickyScroll', async () => {

	test('Verifying the correct lines are rendered', async () => {
		await withAsyncTestCodeEditor([
			'class someTest1 {',
			'',
			'    function1() {',
			'function newFunction() {',
			'	function2(e => {});',
			'',
			'}',
			'function function2(func) {',
			'',
			'	let someVariable = "hi";',
			'}',
			'',
			'}',
			'}',
			'class someTest2 {',
			'}',
		], {}, async (editor) => {
			editor.setPosition({
				lineNumber: 1,
				column: 9
			});
		});
	});
});
