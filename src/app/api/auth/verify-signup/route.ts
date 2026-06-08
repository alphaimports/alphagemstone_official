import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import '@/lib/registerModels';
import { verifySignupOtp } from '@/services/otp.service';
import { errorResponse } from '@/lib/api-response';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
    }
    const { email, otp } = parsed.data;
    const result = await verifySignupOtp(email, otp);

    const response = NextResponse.json({ success: true, data: result }, { status: 201 });
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[verify-signup]', err);
    return errorResponse(err instanceof Error ? err.message : 'Verification failed.', 400);
  }
}