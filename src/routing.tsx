import { createBrowserRouter, redirect } from "react-router-dom";
import { QueryView } from "./views/query/QueryView";
import { ExplorerView } from "./views/explorer/ExplorerView";
import { DesignerView } from "./views/designer/DesignerView";
import { AuthenticationView } from "./views/authentication/AuthenticationView";
import { LiveView } from "./views/live/LiveView";
import { Scaffold } from "./components/Scaffold";

/**
 * The view router instance
 */
export const viewRouter = createBrowserRouter([
	{
		element: <Scaffold />,
		children: [
			{
				path: '/query',
				element: <QueryView />
			},
			{
				path: '/explorer',
				element: <ExplorerView />
			},
			{
				path: '/designer',
				element: <DesignerView />
			},
			{
				path: '/authentication',
				element: <AuthenticationView />
			},
			{
				path: '/live',
				element: <LiveView />
			},
			{
				path: '*',
				loader: () => redirect('/query')
			}
		]
	}
]);