import Splitter, { SplitProps, SplitDirection } from '@devbookhq/splitter';
import { useStable } from '~/hooks/stable';
import { useActiveTab } from '~/hooks/tab';
import { useIsLight } from '~/hooks/theme';
import { actions, store } from '~/store';
import { updateConfig } from '~/util/helpers';
import classes from './style.module.scss';

export interface PanelSplitterProps extends SplitProps {
	id: string;
}

export function PanelSplitter(props: PanelSplitterProps) {
	const isLight = useIsLight();
	const tabInfo = useActiveTab();
	const draggerClass = props.direction === SplitDirection.Vertical
		? classes.contentDraggerVertical
		: classes.contentDraggerHorizontal;

	const handleResize = useStable(async (_: number, sizes: number[]) => {
		if (tabInfo) {
			store.dispatch(actions.updateTab({
				id: tabInfo.id,
				layout: {
					...tabInfo.layout,
					[props.id]: sizes
				}
			}));

			await updateConfig();
		}

		window.getSelection()?.removeAllRanges();
	});

	const sizes = tabInfo?.layout?.[props.id] || props.initialSizes;

	return (
		<div
			style={{
				height: '100%',
				width: '100%',
				'--dragger-color': isLight ? '#F4F5FB' : '#09090a',
				'--dragger-opacity': isLight ? 1 : 0.25
			} as any}
		>
			<Splitter
				{...props}
				gutterClassName={classes.contentGutter}
				draggerClassName={draggerClass}
				onResizeFinished={handleResize}
				initialSizes={sizes}
			>
				{props.children}
			</Splitter>
		</div>
	)
}