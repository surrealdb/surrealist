import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { actions, store } from './store';
import { App } from './components/App';
import { LoadConfig } from '$/go/main/App';
import { loader } from '@monaco-editor/react';

// Load existing config
LoadConfig().then(config => {
	store.dispatch(actions.initialize(config));
});

// Render the app component
const root = document.querySelector('#root')!;

createRoot(root).render(
	<Provider store={store}>
		<App />
	</Provider>
);

// Init monaco
loader.init().then(monaco => {
	monaco.editor.defineTheme('surrealist', {
		base: 'vs',
		inherit: true,
		rules: [
			{ token: 'keyword', foreground: '#e600a4' },
			{ token: 'param', foreground: '#e67a15' },
		],
		colors: {
			'editorLineNumber.foreground': '#9BA9C6',
			'editorLineNumber.activeForeground': '#465671'
		}
	});

	monaco.languages.register({ id: 'surrealql' });

	monaco.languages.setMonarchTokensProvider('surrealql', {
		keywords: [
			'USE', 'LET', 'BEGIN', 'CANCEL', 'COMMIT', 'IF', 'ELSE', 'SELECT', 'INSERT', 'CREATE',
			'UPDATE', 'RELATE', 'DELETE', 'DEFINE', 'REMOVE', 'INFO', 'FROM', 'SET', 'FOR', 'NS', 'DB',
			'TRANSACTION', 'THEN', 'END', 'WHERE', 'SPLIT', 'AT', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
			'COLLATE', 'NUMERIC', 'LIMIT', 'START', 'FETCH', 'TIMEOUT', 'PARALLEL', 'CONTENT', 'RETURN',
			'NONE', 'BEFORE', 'AFTER', 'DIFF', 'MERGE', 'PATCH', 'SCOPE', 'TABLE'
		],
		tokenizer: {
			root: [
				[/\b\w+\b/, {
					cases: {
						'@keywords': 'keyword',
						'@default': 'variable'
					}
				}],
				[/".*?"/, 'string'],
				[/(\/\/|#|--)/, 'comment'],
				[/\$\w+/, 'param']
			]
		}
	});
})