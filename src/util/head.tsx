import { FontLinks } from "@surrealdb/ui";
import { createPortal } from "react-dom";

export const HeadInjector = () => createPortal(<FontLinks />, document.head);
