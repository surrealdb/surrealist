import { SurrealistEditorProps } from './shared';
import { SurrealistMonacoEditor } from './monaco';
import { useFeatureFlags } from '~/util/feature-flags';
import { SurrealistCodemirrorEditor } from './codemirror';

export function SurrealistEditor(props: SurrealistEditorProps) {
	const [flags] = useFeatureFlags();

	return flags.editor == "codemirror" ? (
		<SurrealistCodemirrorEditor {...props} />
	) : (
		<SurrealistMonacoEditor {...props} />
	);
}
