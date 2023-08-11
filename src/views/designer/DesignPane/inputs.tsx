import classes from './style.module.scss';
import { ActionIcon, Button, Group, Modal, Textarea, TextareaProps, Title } from '@mantine/core';
import { mdiCancel, mdiCheck, mdiWrench } from '@mdi/js';
import { ChangeEvent, useState } from 'react';
import { Icon } from '~/components/Icon';
import { Spacer } from '~/components/Spacer';
import { useStable } from '~/hooks/stable';
import { useIsLight } from '~/hooks/theme';
import { SurrealistEditor } from '~/components/SurrealistEditor';

export interface QueryInputProps extends TextareaProps {
	onChangeText?: (value: string) => void;
}

export function QueryInput(props: QueryInputProps) {
	const { onChangeText, ...rest } = props;
	const isLight = useIsLight();

	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editorText, setEditorText] = useState<string | undefined>();

	const openEditor = useStable(() => {
		setIsEditorOpen(true);
		setEditorText((props.value as string) || '');
	});

	const closeEditor = useStable(() => {
		setIsEditorOpen(false);
	});

	const saveEditor = useStable(() => {
		if (onChangeText) {
			onChangeText(editorText || '');
		}

		closeEditor();
	});

	const propagateChange = useStable((e: ChangeEvent<HTMLTextAreaElement>) => {
		if (onChangeText) {
			onChangeText(e.target.value);
		}
	});

	const color = isLight ? 'light' : undefined;

	return (
		<>
			<Textarea
				label='Query input'
				rightSectionWidth={44}
				{...rest}
				minRows={1}
				maxRows={1}
				className={classes.input}
				onChange={propagateChange}
				rightSection={
					<Group spacing={8} noWrap>
						{props.rightSection}
						<ActionIcon title='Advanced editor' onClick={openEditor} color={color}>
							<Icon path={mdiWrench} size='sm' color={color} />
						</ActionIcon>
					</Group>
				}
			/>

			<Modal opened={isEditorOpen} onClose={closeEditor} trapFocus={false} size='lg' title='Advanced editor'>
				<SurrealistEditor
					language='surrealql'
					value={editorText}
					onChange={setEditorText}
					height={300}
					options={{
						wrappingStrategy: 'advanced',
						wordWrap: 'on',
						suggest: {
							showProperties: false,
						},
					}}
				/>
				<Group mt='lg'>
					<Button onClick={closeEditor} color={isLight ? 'light.5' : 'light.3'} variant='light'>
						Discard
					</Button>
					<Spacer />
					<Button color='surreal' onClick={saveEditor} type='submit'>
						Save
					</Button>
				</Group>
			</Modal>
		</>
	);
}

export interface PermissionInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function PermissionInput(props: PermissionInputProps) {
	return (
		<QueryInput
			required
			placeholder='WHERE (user = $auth.id)'
			label={props.label}
			value={props.value}
			onChangeText={(value) => props.onChange(value)}
			rightSectionWidth={114}
			rightSection={
				<>
					<ActionIcon
						color='green'
						title='Grant full access'
						onClick={() => props.onChange('FULL')}
						variant={props.value.toUpperCase() === 'FULL' ? 'light' : 'subtle'}>
						<Icon path={mdiCheck} />
					</ActionIcon>
					<ActionIcon
						color='red.5'
						title='Reject all access'
						onClick={() => props.onChange('NONE')}
						variant={props.value.toUpperCase() === 'NONE' ? 'light' : 'subtle'}>
						<Icon path={mdiCancel} />
					</ActionIcon>
				</>
			}
		/>
	);
}
