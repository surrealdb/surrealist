import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import { useMantineTheme } from "@mantine/core";

export interface GraphProps {

}

export function Graph(props: GraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const cy = useRef<cytoscape.Core>();
	const theme = useMantineTheme();

	useEffect(() => {
		const instance = cytoscape({
			container: ref.current,

			elements: [
				{ // node a
					data: { id: 'a' }
				},
				{ // node b
					data: { id: 'b' }
				},
				{ // node b
					data: { id: 'c' }
				},
				{ // edge ab
					data: { id: 'ab', source: 'a', target: 'b' }
				}
			],

			style: [ // the stylesheet for the graph
				{
					selector: 'node',
					style: {
						'background-color': theme.colors.surreal[5],
						'label': 'data(id)',
						'color': '#FFFFFF'
					}
				},

				{
					selector: 'edge',
					style: {
						'width': 3,
						'line-color': '#ccc',
						'target-arrow-color': '#ccc',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier'
					}
				}
			],

			layout: {
				name: 'random'
			}
		});

		cy.current = instance;
	}, []);

	return (
		<div
			ref={ref}
			style={{ height: '100%' }}
		/>
	)
}