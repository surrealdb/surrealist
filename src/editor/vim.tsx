import type { Extension } from "@codemirror/state";
import { vim } from "@replit/codemirror-vim";

/**
 * The Vim keybinding layer for full editors, including the status bar
 * panel that displays the active mode and any pending command.
 *
 * This must be applied before the other editor keymaps so that Vim
 * bindings take precedence while in normal mode.
 */
export const vimMode = (): Extension => vim({ status: true });
