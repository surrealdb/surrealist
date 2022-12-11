import { createRoot } from 'react-dom/client';
import { Scaffold } from './components/Scaffold';
import { Provider } from "react-redux";
import { store } from './store';
import { MantineProvider } from '@mantine/core';
import { App } from './components/App';

// Render the app component
const root = document.querySelector('#root')!;

createRoot(root).render(
	<Provider store={store}>
		<App />
	</Provider>
);