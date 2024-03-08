import { CodeEditorProps } from './shared';
import { InternalMonacoEditor } from './monaco';
import { useFeatureFlags } from '~/util/feature-flags';
import { InternalCodeMirrorEditor } from './codemirror';

export function CodeEditor(props: CodeEditorProps) {
	const [flags] = useFeatureFlags();

	return flags.editor == "codemirror" ? (
		<InternalCodeMirrorEditor {...props} />
	) : (
		<InternalMonacoEditor {...props} />
	);
}
