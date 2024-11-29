import { Button, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { iconCheck, iconChevronLeft, iconChevronRight } from "~/util/icons";

export interface StepActionsProps {
	step: number;
	nextStep?: number;
	disabled?: boolean;
	onPrevious: () => void;
	onContinue: () => void;
}

export function StepActions({ step, onPrevious, onContinue, disabled }: StepActionsProps) {
	const willExit = step === 0;
	const willCreate = step === 5;

	const handlePrevious = useStable(() => onPrevious());
	const handleContinue = useStable(() => onContinue());

	return (
		<Group mt="xl">
			<Button
				w={150}
				color="slate"
				variant="light"
				onClick={handlePrevious}
				leftSection={<Icon path={iconChevronLeft} />}
			>
				{willExit ? "Close" : "Previous"}
			</Button>
			<Spacer />
			<Button
				w={150}
				type="submit"
				variant="gradient"
				disabled={disabled}
				onClick={handleContinue}
				rightSection={<Icon path={willCreate ? iconCheck : iconChevronRight} />}
			>
				{willCreate ? "Create" : "Continue"}
			</Button>
		</Group>
	);
}
