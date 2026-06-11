'use client';

/**
 * AdminOrderShipping
 * ──────────────────
 * Drop into your admin order detail page to:
 *   - Show the shipping rate the customer selected at checkout
 *   - Purchase a ShipEngine label with one click
 *   - Display tracking number + print label PDF link once purchased
 *
 * Usage:
 *   import AdminOrderShipping from '@/components/admin/AdminOrderShipping';
 *   <AdminOrderShipping order={order} />
 */

import { useState } from 'react';

interface OrderShippingData {
  _id:                      string;
  shippingCarrier?:         string | null;
  shippingService?:         string | null;
  shippingRateId?:          string | null;
  shippingRate?:            number;
  shippingEstimatedDelivery?: string | null;
  trackingNumber?:          string | null;
  labelId?:                 string | null;
  labelUrl?:                string | null;
  shippedAt?:               string | null;
  status:                   string;
  paymentStatus:            string;
}

interface Props {
  order: OrderShippingData;
}

export default function AdminOrderShipping({ order }: Props) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');
  const [labelUrl,       setLabelUrl]       = useState(order.labelUrl ?? '');
  const [shippedAt,      setShippedAt]      = useState(order.shippedAt ?? '');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState<string | null>(null);

  const labelAlreadyPurchased = Boolean(trackingNumber);

  async function handlePurchaseLabel() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token') ?? ''
          : '';

      const res = await fetch(
        `/api/admin/orders/${order._id}/purchase-label`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to purchase label');

      const updated = data.data?.order;
      if (updated?.trackingNumber) {
        setTrackingNumber(updated.trackingNumber);
        setLabelUrl(updated.labelUrl ?? '');
        setShippedAt(updated.shippedAt ?? new Date().toISOString());
        setSuccess(`Label purchased! Tracking: ${updated.trackingNumber}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const canPurchase =
    order.paymentStatus === 'completed' &&
    Boolean(order.shippingRateId) &&
    !labelAlreadyPurchased;

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">Shipping</h3>

      {/* Feedback banners */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Rate selection summary */}
      <dl className="space-y-2 text-sm">
        {order.shippingCarrier && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Carrier</dt>
            <dd className="font-medium text-gray-900">{order.shippingCarrier}</dd>
          </div>
        )}
        {order.shippingService && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Service</dt>
            <dd className="text-gray-900">{order.shippingService}</dd>
          </div>
        )}
        {order.shippingRate != null && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Quoted Rate</dt>
            <dd className="text-gray-900">${order.shippingRate.toFixed(2)}</dd>
          </div>
        )}
        {order.shippingEstimatedDelivery && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Est. Delivery</dt>
            <dd className="text-gray-900">{order.shippingEstimatedDelivery}</dd>
          </div>
        )}
        {order.shippingRateId && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Rate ID</dt>
            <dd className="font-mono text-xs text-gray-500">{order.shippingRateId}</dd>
          </div>
        )}
      </dl>

      {/* Label + tracking info */}
      {labelAlreadyPurchased && (
        <dl className="space-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Tracking #</dt>
            <dd className="font-mono font-medium text-gray-900">{trackingNumber}</dd>
          </div>
          {shippedAt && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Label Created</dt>
              <dd className="text-gray-900">
                {new Date(shippedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {!labelAlreadyPurchased && (
          <button
            onClick={handlePurchaseLabel}
            disabled={loading || !canPurchase}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Purchasing…' : 'Purchase ShipEngine Label'}
          </button>
        )}

        {labelUrl && (
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Print Label (PDF)
          </a>
        )}
      </div>

      {/* Warnings */}
      {!order.shippingRateId && !labelAlreadyPurchased && (
        <p className="text-xs text-amber-600">
          No shipping rate was selected at checkout. Add a tracking number
          manually via the order status panel, or have the customer re-checkout
          with a shipping method selected.
        </p>
      )}
      {order.paymentStatus !== 'completed' && !labelAlreadyPurchased && (
        <p className="text-xs text-red-500">
          Payment not yet completed — label cannot be purchased until payment is
          captured.
        </p>
      )}
    </div>
  );
}