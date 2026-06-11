/**
 * POST /api/admin/orders/:id/purchase-label
 * Admin-only. Purchases a ShipEngine label for an order using its stored rateId.
 * Optionally accepts { "rateId": "..." } in the body to override.
 *
 * On success, saves labelId, labelUrl, trackingNumber, and shippedAt to the order.
 */

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { withAdmin } from '@/middleware/auth.middleware';
import { purchaseAndSaveLabel } from '@/services/order.service';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const rateIdOverride: string | undefined = body?.rateId ?? undefined;

    const order = await purchaseAndSaveLabel(id, rateIdOverride);
    return apiSuccess({ order });
  } catch (err: any) {
    console.error('[admin/orders/purchase-label]', err);
    return apiError(err.message ?? 'Failed to purchase label', 500);
  }
}

export const POST = withAdmin(handler);