import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

/**
 * Create payment intent for consultation
 * @param amount Amount in cents
 * @param consultationId Consultation ID for metadata
 * @param patientId Patient ID for metadata
 * @returns Payment intent
 */
export async function createPaymentIntent(
    amount: number,
    consultationId: string,
    patientId: string
): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd', // Change based on your region
        metadata: {
            consultationId,
            patientId,
        },
        automatic_payment_methods: {
            enabled: true,
        },
    });

    return paymentIntent;
}

/**
 * Verify payment status
 * @param paymentIntentId Payment intent ID
 * @returns Payment intent with status
 */
export async function verifyPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create refund
 * @param paymentIntentId Payment intent ID
 * @param amount Amount to refund in cents (optional, defaults to full refund)
 * @returns Refund object
 */
export async function createRefund(
    paymentIntentId: string,
    amount?: number
): Promise<Stripe.Refund> {
    const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
    };

    if (amount) {
        refundData.amount = amount;
    }

    return await stripe.refunds.create(refundData);
}

/**
 * Handle Stripe webhook events
 * @param rawBody Raw request body
 * @param signature Stripe signature header
 * @returns Stripe event
 */
export function constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string
): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export default stripe;
