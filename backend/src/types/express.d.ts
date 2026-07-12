import type { Payload } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: Payload;
    }
  }
}
