/**
 * POST /api/shipping/track
 * Tracks a package via ShipEngine.
 *
 * Body: { "trackingNumber": "1Z999AA10123456784", "carrierCode": "ups" }
 *   carrierCode is optional — inferred from tracking number format when omitted.
 *
 * Common ShipEngine carrier codes: ups | stamps_com (USPS) | fedex | dhl_express
 */

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { trackShipEnginePackage } from '@/services/shipengine.service';

export async function POST(req: NextRequest) {
  try {
    const { trackingNumber, carrierCode } = await req.json();

    if (!trackingNumber?.trim()) {
      return apiError('trackingNumber is required', 400);
    }

    const tracking = await trackShipEnginePackage(
      trackingNumber.trim(),
      carrierCode?.toLowerCase()
    );

    return apiSuccess(tracking);
  } catch (err: any) {
    console.error('[shipping/track]', err);
    return apiError(err.message ?? 'Tracking failed', 500);
  }
}