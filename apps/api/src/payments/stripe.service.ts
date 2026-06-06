import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import StripeSDK from "stripe";

type Stripe = InstanceType<typeof StripeSDK>;
type PaymentIntent = Awaited<ReturnType<Stripe["paymentIntents"]["retrieve"]>>;

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY") ?? "";
    this.stripe = new StripeSDK(secretKey, {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  async createSetupIntent(
    customerId?: string,
  ): Promise<{ clientSecret: string }> {
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });
    return { clientSecret: setupIntent.client_secret! };
  }

  async confirmCardSetup(
    clientSecret: string,
    paymentMethodId: string,
  ): Promise<{ status: string; paymentMethodId: string; last4: string }> {
    const setupIntent = await this.stripe.setupIntents.confirm(clientSecret, {
      payment_method: paymentMethodId,
    });

    const paymentMethod =
      await this.stripe.paymentMethods.retrieve(paymentMethodId);
    const last4 = paymentMethod.card?.last4 ?? "****";

    return {
      status: setupIntent.status,
      paymentMethodId,
      last4,
    };
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      metadata: params.metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    return this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
    });
  }
}
