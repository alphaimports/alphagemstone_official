import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { resendCouponEmail } from '@/services/coupon.service';
import { withAdmin } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/admin/coupons/[id]/resend-email
export const POST = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectDB();
    await resendCouponEmail(params.id);
    return successResponse({ message: 'Coupon email resent.' });
  } catch (err) {
    console.error('[admin/coupons/resend-email]', err);
    return errorResponse(err instanceof Error ? err.message : 'Failed to resend email', 400);
  }
});