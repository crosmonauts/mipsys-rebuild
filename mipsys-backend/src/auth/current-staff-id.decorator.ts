import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface StaffRequestUser {
  staffId?: number | null;
}

// staffId murni dari JWT (ditentukan server saat login).
// TIDAK fallback ke user.id: user tanpa staff (ex: SUPER_ADMIN)
// me-return null agar tidak melanggar FK staff(id).
export const CurrentStaffId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: StaffRequestUser }>();
    return request.user?.staffId ?? null;
  }
);
