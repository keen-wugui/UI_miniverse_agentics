import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers
// The worker will bypass static assets automatically through handlers
export const worker = setupWorker(...handlers);
