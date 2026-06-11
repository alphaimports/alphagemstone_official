/**
 * ShipEngine Service
 * ──────────────────
 * All ShipEngine SDK interactions live here:
 *   getShipEngineRates        — fetch rates for a shipment
 *   trackShipEnginePackage    — track by tracking number + carrier code
 *   purchaseLabelFromRate     — buy a label using a rate ID
 *   validateShipEngineAddress — validate/normalize an address
 *
 * Required env var: SHIPENGINE_API_KEY (sandbox keys start with "TEST_")
 * Optional env var: SHIPENGINE_CARRIER_IDS (comma-separated carrier IDs from dashboard)
 */

import ShipEngine from 'shipengine';
import type {
  ShippingAddress,
  PackageDimensions,
  ShippingRate,
  TrackingInfo,
  TrackingEvent,
} from '@/types/shipping';

// ─── Client singleton ─────────────────────────────────────────────────────────

function getClient(): InstanceType<typeof ShipEngine> {
  const apiKey = process.env.SHIPENGINE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SHIPENGINE_API_KEY is not set. Add it to your .env.local file.'
    );
  }
  return new ShipEngine({ apiKey, retries: 2, timeout: 30_000 });
}

// ─── Address mapper ───────────────────────────────────────────────────────────

function toShipEngineAddress(addr: ShippingAddress) {
  return {
    name:          addr.fullName   ?? '',
    company:       addr.company    ?? '',
    addressLine1:  addr.street1,
    addressLine2:  addr.street2    ?? '',
    cityLocality:  addr.city,
    stateProvince: addr.state,
    postalCode:    addr.postalCode,
    countryCode:   addr.country    ?? 'US',
    phone:         addr.phone      ?? '',
  };
}

// ─── Get Rates ────────────────────────────────────────────────────────────────

export async function getShipEngineRates(
  origin: ShippingAddress,
  destination: ShippingAddress,
  pkg: PackageDimensions
): Promise<ShippingRate[]> {
  const client = getClient();

  const carrierIds = getCarrierIds();

  const result = await client.getRatesWithShipmentDetails({
    shipment: {
      shipFrom: toShipEngineAddress(origin),
      shipTo:   toShipEngineAddress(destination),
      packages: [
        {
          weight: {
            value: pkg.weightLbs,
            unit:  'pound',
          },
          dimensions: {
            length: pkg.lengthIn,
            width:  pkg.widthIn,
            height: pkg.heightIn,
            unit:   'inch',
          },
          ...(pkg.declaredValueUsd
            ? { insuredValue: { currency: 'usd', amount: pkg.declaredValueUsd } }
            : {}),
        },
      ],
    },
    rateOptions: {
      ...(carrierIds.length > 0 ? { carrierIds } : {}),
    },
  });

  const rates: ShippingRate[] = (result.rateResponse?.rates ?? [])
    .filter(
      (r: any) =>
        r.rateType === 'shipment' &&
        (!r.errorMessages || r.errorMessages.length === 0)
    )
    .map((r: any): ShippingRate => ({
      carrier:          r.carrierFriendlyName ?? r.carrierId ?? 'Unknown',
      carrierId:        r.carrierId           ?? '',
      service:          r.serviceType         ?? r.serviceCode ?? '',
      serviceCode:      r.serviceCode         ?? '',
      rateId:           r.rateId              ?? '',
      rate:             r.shippingAmount?.amount ?? 0,
      currency:         'USD',
      estimatedDays:    r.deliveryDays        ?? null,
      estimatedDelivery: r.estimatedDeliveryDate
        ? new Date(r.estimatedDeliveryDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month:   'short',
            day:     'numeric',
          })
        : null,
      guaranteed:    r.guaranteedService ?? false,
      negotiatedRate: r.negotiatedRate   ?? false,
    }))
    .sort((a, b) => a.rate - b.rate);

  return rates;
}

// ─── Track Package ────────────────────────────────────────────────────────────

export async function trackShipEnginePackage(
  trackingNumber: string,
  carrierCode?: string
): Promise<TrackingInfo> {
  const client = getClient();

  const resolvedCarrier = carrierCode ?? inferCarrierCode(trackingNumber);

  const result: any = await client.trackUsingCarrierCodeAndTrackingNumber({
    carrierCode:    resolvedCarrier,
    trackingNumber,
  });

  const events: TrackingEvent[] = (result.events ?? []).map((e: any) => ({
    timestamp: e.occurredAt
      ? new Date(e.occurredAt).toLocaleString('en-US')
      : '',
    description: e.description ?? e.eventCode ?? '',
    location:    [e.cityLocality, e.stateProvince, e.countryCode]
      .filter(Boolean)
      .join(', '),
  }));

  return {
    carrier:         result.carrierStatusDescription ?? resolvedCarrier,
    trackingNumber,
    status:          result.statusDescription ?? result.statusCode ?? 'Unknown',
    currentLocation: events[0]?.location ?? 'Unknown',
    lastUpdate:      events[0]?.timestamp ?? 'Unknown',
    estimatedDelivery: result.estimatedDeliveryDate
      ? new Date(result.estimatedDeliveryDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month:   'short',
          day:     'numeric',
        })
      : null,
    events,
    deliveredAt: result.actualDeliveryDate
      ? new Date(result.actualDeliveryDate).toLocaleString('en-US')
      : undefined,
  };
}

// ─── Purchase Label ───────────────────────────────────────────────────────────

export async function purchaseLabelFromRate(rateId: string): Promise<{
  labelId:       string;
  trackingNumber: string;
  labelUrl:      string;
  carrierId:     string;
  serviceCode:   string;
  shipDate:      string;
}> {
  const client = getClient();

  const label: any = await client.createLabelFromRate({ rateId });

  return {
    labelId:        label.labelId        ?? '',
    trackingNumber: label.trackingNumber ?? '',
    labelUrl:       label.labelDownload?.href ?? '',
    carrierId:      label.carrierId      ?? '',
    serviceCode:    label.serviceCode    ?? '',
    shipDate:       label.shipDate       ?? '',
  };
}

// ─── Validate Address ─────────────────────────────────────────────────────────

export async function validateShipEngineAddress(addr: ShippingAddress): Promise<{
  valid:      boolean;
  normalized?: ShippingAddress;
  messages:  string[];
}> {
  const client = getClient();

  const [result]: any[] = await client.validateAddresses([
    toShipEngineAddress(addr),
  ]);

  const valid    = result.status === 'verified';
  const messages = (result.messages ?? []).map((m: any) =>
    typeof m === 'string' ? m : (m.message ?? String(m))
  );

  let normalized: ShippingAddress | undefined;
  if (valid && result.normalizedAddress) {
    const n = result.normalizedAddress as any;
    normalized = {
      fullName:   n.name          ?? addr.fullName,
      company:    n.company       ?? addr.company,
      street1:    n.addressLine1  ?? addr.street1,
      street2:    n.addressLine2  ?? addr.street2,
      city:       n.cityLocality  ?? addr.city,
      state:      n.stateProvince ?? addr.state,
      postalCode: n.postalCode    ?? addr.postalCode,
      country:    n.countryCode   ?? addr.country,
    };
  }

  return { valid, normalized, messages };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns carrier IDs from SHIPENGINE_CARRIER_IDS env var.
 * When empty, ShipEngine uses all carriers connected to your account.
 * Find your carrier IDs at: https://app.shipengine.com/settings/carriers
 */
function getCarrierIds(): string[] {
  return (process.env.SHIPENGINE_CARRIER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Infers ShipEngine carrier code from tracking number format.
 * Used as a fallback when caller doesn't provide a carrier code.
 *
 * ShipEngine carrier codes: "ups", "stamps_com" (USPS), "fedex", "dhl_express"
 */
function inferCarrierCode(tn: string): string {
  if (/^1Z[0-9A-Z]{16}$/i.test(tn))             return 'ups';
  if (/^9[0-9]{19,21}$/.test(tn))               return 'stamps_com';
  if (/^(7[0-9]{19}|[A-Z]{2}[0-9]{9}US)$/.test(tn)) return 'stamps_com';
  if (/^(96|98)[0-9]{18,20}$/.test(tn))         return 'fedex';
  if (/^[0-9]{12}$/.test(tn) || /^[0-9]{15}$/.test(tn)) return 'fedex';
  return 'stamps_com';
}