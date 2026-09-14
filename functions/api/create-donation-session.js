// Creates a Stripe Checkout Session for a one-off or monthly recurring donation
// to JRD Inclusion FC / the JRD Foundation team fund (trips, training, tournaments),
// with a donor-chosen amount rather than a fixed Price ID.
//
// Cloudflare Pages Function. Calls the Stripe REST API directly via fetch
// rather than the Stripe Node SDK, since Cloudflare Pages Functions does not
// run `npm install` for the functions/ bundle, so npm packages like "stripe"
// cannot be resolved at build time.
//
// Required environment variable (set in Cloudflare Pages project settings, never in git):
//   STRIPE_SECRET_KEY - Stripe secret key (sk_live_... or sk_test_...), for the
//                        Stripe account/bank account the club wants donations paid into.
//
// The donation amount and frequency are chosen by the donor on the page and sent
// here as { amount, interval }. amount is in pence (integer), interval is either
// "one_time" or "month".

const MIN_AMOUNT_PENCE = 200;    // £2 minimum
const MAX_AMOUNT_PENCE = 500000; // £5,000 maximum, sanity cap

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'Online donations are not set up yet. Please get in touch to support the club directly.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let amount, interval;
  try {
    ({ amount, interval } = await request.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  amount = Math.round(Number(amount));
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_PENCE || amount > MAX_AMOUNT_PENCE) {
    return new Response(JSON.stringify({ error: 'Please enter an amount between £2 and £5,000.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const isMonthly = interval === 'month';
  const siteUrl = new URL(request.url).origin;

  const body = new URLSearchParams();
  body.set('mode', isMonthly ? 'subscription' : 'payment');
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', 'gbp');
  body.set('line_items[0][price_data][unit_amount]', String(amount));
  body.set(
    'line_items[0][price_data][product_data][name]',
    isMonthly ? 'Monthly donation to JRD Inclusion FC' : 'Donation to JRD Inclusion FC'
  );
  if (isMonthly) {
    body.set('line_items[0][price_data][recurring][interval]', 'month');
  } else {
    body.set('submit_type', 'donate');
  }
  body.set('success_url', `${siteUrl}/foundation/thank-you/?session_id={CHECKOUT_SESSION_ID}`);
  body.set('cancel_url', `${siteUrl}/foundation/`);
  body.set('billing_address_collection', 'auto');

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Could not start checkout. Please try again or get in touch to donate directly.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Could not start checkout. Please try again or get in touch to donate directly.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405 });
}
