import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IReqUser } from "backend/src/shared/types";

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as IReqUser;
  },
)