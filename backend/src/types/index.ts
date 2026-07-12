import { type Request } from "express";

export type TypeRequest<
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> = Request<TParams, unknown, TBody, TQuery>;

export type Payload = {
  id: string;
  email: string;
};
