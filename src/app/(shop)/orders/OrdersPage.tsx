'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OrderTracking from '@/components/shipping/OrderTracking';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface Order {
  _id: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  // ShipEngine shipping fields
  shippingCarrier?:           string | null;
  shippingService?:           string | null;
  shippingServiceCode?:       string | null;
  shippingRate?:              number;
  shippingEstimatedDelivery?: string | null;
  shippingEstimatedDays?:     number | null;
  shippingRateId?:            string | null;
  trackingNumber?:            string | null;
  trackingUrl?:               string | null;
  labelId?:                   string | null;
  labelUrl?:                  string | null;
  shippedAt?:                 string | null;
  // Legacy
  fedex?: { trackingNumber: string; serviceType: string; estimatedDelivery?: string } | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending:    { label: 'Pending',    bg: '#fdf5e6', text: '#8b5e1a', border: '#e0c070', dot: '#d4a843' },
  paid:       { label: 'Paid',       bg: '#edf7ed', text: '#2d6b2d', border: '#80c880', dot: '#4caf50' },
  processing: { label: 'Processing', bg: '#e8f0fb', text: '#1a4a9e', border: '#7ab0c9', dot: '#4a90d9' },
  shipped:    { label: 'Shipped',    bg: '#f3eefb', text: '#5a2d8b', border: '#b090d4', dot: '#9c5fd4' },
  delivered:  { label: 'Delivered',  bg: '#edf7ed', text: '#2d6b2d', border: '#80c880', dot: '#4caf50' },
  cancelled:  { label: 'Cancelled',  bg: '#fdf0f0', text: '#9e2d2d', border: '#d48080', dot: '#d44' },
  refunded:   { label: 'Refunded',   bg: '#f5f5f5', text: '#5a5a5a', border: '#b0b0b0', dot: '#888' },
};

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const ITEM_EMOJIS = ['💎', '💍', '🌟', '✨', '🪙'];

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#f5f5f5', text: '#555', border: '#ccc', dot: '#999' };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-semibold tracking-wide uppercase"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function ProgressSteps({ status }: { status: string }) {
  const current = STEPS.indexOf(status);
  const labels = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((_, i) => {
        const done    = i <= current;
        const active  = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold border-2 transition-all ${done ? 'border-[#c9a84c] bg-[#c9a84c] text-white' : 'border-stone-200 bg-white text-stone-300'} ${active ? 'ring-2 ring-[#c9a84c]/30' : ''}`}>
                {done && i < current ? '✓' : i + 1}
              </div>
              <span className={`text-[0.55rem] font-medium whitespace-nowrap ${done ? 'text-[#c9a84c]' : 'text-stone-300'}`}>
                {labels[i]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 ${i < current ? 'bg-[#c9a84c]' : 'bg-stone-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShippingBadge({ order }: { order: Order }) {
  const carrier = order.shippingCarrier ?? (order.fedex ? 'FedEx' : null);
  if (!carrier) return null;
  return (
    <div className="flex items-center gap-2 text-[0.72rem] text-stone-500">
      <span className="font-semibold text-stone-700">{carrier}</span>
      {order.shippingService && <span className="text-stone-400">· {order.shippingService}</span>}
      {order.shippingCost > 0 && (
        <span className="ml-auto font-medium text-stone-600">${order.shippingCost.toFixed(2)}</span>
      )}
    </div>
  );
}

// ─── Shipment Status Panel (shown on order card) ──────────────────────────────
function ShipmentPanel({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const trackingNumber = order.trackingNumber ?? order.fedex?.trackingNumber ?? null;
  const carrier = order.shippingCarrier ?? (order.fedex ? 'FedEx' : null);

  if (!order.shippingRateId && !trackingNumber) {
    if (['paid', 'processing'].includes(order.status)) {
      return (
        <div className="border-t border-stone-100 px-5 py-3 bg-amber-50/60">
          <div className="flex items-center gap-2 text-[0.72rem] text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Your order is being prepared for shipment. A tracking number will appear here soon.
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="border-t border-stone-100">
      {/* Shipping summary row */}
      <div className="px-5 py-3 bg-stone-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {carrier && (
              <span className="text-[0.68rem] font-bold text-stone-600 uppercase tracking-wider">{carrier}</span>
            )}
            {order.shippingService && (
              <span className="text-[0.68rem] text-stone-400">{order.shippingService}</span>
            )}
            {trackingNumber && (
              <span className="font-mono text-[0.68rem] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                {trackingNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {order.shippingEstimatedDelivery && !trackingNumber && (
              <span className="text-[0.65rem] text-stone-400">
                Est. {order.shippingEstimatedDelivery}
              </span>
            )}
            {order.labelUrl && (
              <a href={order.labelUrl} target="_blank" rel="noopener noreferrer"
                className="text-[0.65rem] font-medium text-[#c9a84c] hover:underline flex items-center gap-1">
                🖨 Label
              </a>
            )}
            {trackingNumber && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-[0.68rem] font-semibold px-3 py-1 rounded-full border transition-colors"
                style={expanded
                  ? { background: '#1a1714', color: '#fff', borderColor: '#1a1714' }
                  : { background: '#fff', color: '#5a5249', borderColor: '#ede9e1' }}>
                {expanded ? 'Hide' : 'Track Package'}
              </button>
            )}
          </div>
        </div>

        {/* Delivery estimate */}
        {order.shippingEstimatedDelivery && trackingNumber && (
          <p className="text-[0.65rem] text-stone-400 mt-1.5">
            📦 Estimated delivery: <span className="font-medium text-stone-600">{order.shippingEstimatedDelivery}</span>
          </p>
        )}
        {order.shippedAt && (
          <p className="text-[0.65rem] text-stone-400 mt-0.5">
            Shipped on {new Date(order.shippedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Live tracking widget */}
      {expanded && trackingNumber && (
        <div className="px-5 pb-4 pt-2">
          <OrderTracking
            trackingNumber={trackingNumber}
            trackingUrl={order.trackingUrl ?? undefined}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { apiFetch } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const success = searchParams.get('success');

  useEffect(() => {
    apiFetch('/api/orders')
      .then((d) => setOrders(d.data || []))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-stone-400 text-sm">Loading orders…</div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="px-6 pt-10 pb-6 border-b border-stone-100 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-light text-stone-900 tracking-tight">
            My <span className="italic text-amber-700">Orders</span>
          </h1>
          <p className="text-sm text-stone-400 mt-1.5 tracking-wide">Track and manage your purchases</p>
        </div>
        <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full tracking-widest uppercase">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mx-6 mt-5 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs">✓</div>
          <p className="text-sm text-green-700 font-medium">Payment successful — your order has been placed. Your shipping label will be generated shortly.</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-stone-400">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-base mb-6">No orders yet</p>
          <Link href="/products" className="bg-stone-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-stone-800 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="px-6 pb-12">

          {/* Stats */}
          <div className="grid grid-cols-3 mt-6 mb-6 rounded-xl overflow-hidden border border-stone-100 divide-x divide-stone-100">
            {[
              { label: 'Total spent',     value: `$${totalSpent.toLocaleString()}` },
              { label: 'Orders placed',   value: orders.length },
              { label: 'Items purchased', value: totalItems },
            ].map(({ label, value }) => (
              <div key={label} className="bg-stone-50 px-5 py-4">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-light text-stone-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Order cards */}
          <div className="flex flex-col gap-4">
            {orders.map((order, oi) => (
              <div key={order._id} className="border border-stone-100 rounded-2xl overflow-hidden hover:border-stone-200 hover:shadow-sm transition-all">

                {/* Card header */}
                <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono text-stone-400 tracking-wide uppercase">
                      #{order._id.slice(-12)}
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light text-stone-900">${order.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-stone-400 mt-0.5">order total</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-3 border-t border-stone-50">
                  <ProgressSteps status={order.status} />
                </div>

                {/* Status + carrier */}
                <div className="px-5 py-2.5 border-t border-stone-50 bg-stone-50/40 flex items-center justify-between gap-3">
                  <StatusPill status={order.status} />
                  <ShippingBadge order={order} />
                </div>

                {/* Items — collapsed by default, expand on click */}
                <div className="border-t border-stone-50">
                  <button
                    onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                    className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-stone-50/60 transition-colors">
                    <span className="text-[0.72rem] font-medium text-stone-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[0.65rem] text-stone-400">{expanded === order._id ? '▲ Hide' : '▼ View items'}</span>
                  </button>

                  {expanded === order._id && (
                    <div className="px-5 pb-4 flex flex-col gap-3 border-t border-stone-50">

                      {order.items.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-base flex-shrink-0">
                              {ITEM_EMOJIS[(oi + ii) % ITEM_EMOJIS.length]}
                            </div>
                            <div>
                              <p className="text-sm text-stone-700">{item.name}</p>
                              <p className="text-xs text-stone-400 mt-0.5">Qty {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-stone-600">${item.price.toLocaleString()}</p>
                        </div>
                      ))}

                      {/* Order totals */}
                      <div className="pt-3 border-t border-stone-100 space-y-1.5 text-[0.72rem]">
                        {[
                          { label: 'Subtotal',  value: `$${(order.subtotal ?? order.totalAmount - order.shippingCost - order.tax).toFixed(2)}` },
                          { label: 'Shipping',  value: order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : 'Free' },
                          { label: 'Tax',       value: `$${(order.tax ?? 0).toFixed(2)}` },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-stone-500">
                            <span>{label}</span><span>{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-stone-800 pt-1 border-t border-stone-100">
                          <span>Total</span><span>${order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Ship-to address */}
                      {order.shippingAddress && (
                        <div className="pt-2 border-t border-stone-100">
                          <p className="text-[0.6rem] uppercase tracking-widest text-stone-400 font-semibold mb-1.5">Ship To</p>
                          <div className="text-[0.72rem] text-stone-500 leading-relaxed">
                            <p className="font-medium text-stone-700">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipment panel — always shown */}
                <ShipmentPanel order={order} />

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}