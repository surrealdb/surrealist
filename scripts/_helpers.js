import { execSync } from 'child_process';

export class Dir {

	#directory;

	constructor(directory) {
		this.#directory = directory;
	}
	
	exec(command) {
		execSync(command, {
			cwd: this.#directory,
			stdio: 'inherit'
		})
	}

}