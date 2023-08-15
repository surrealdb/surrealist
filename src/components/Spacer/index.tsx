export interface SpacerProps {
	grow?: boolean | number;
}

export const Spacer = ({ grow }: SpacerProps) => {
	return <span style={{ flexGrow: grow ? +grow : 1 }} />;
};
