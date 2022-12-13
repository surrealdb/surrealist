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
		rules: [],
		colors: {
			'editorLineNumber.foreground': '#9BA9C6',
			'editorLineNumber.activeForeground': '#465671'
		}
	});
})