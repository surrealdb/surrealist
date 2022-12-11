import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { store } from './store';
import { App } from './components/App';

// Render the app component
const root = document.querySelector('#root')!;

createRoot(root).render(
	<Provider store={store}>
		<App />
	</Provider>
);