import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [stripePrices, stripeProducts] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  // merge stripe products and prices into a single list
  const products = stripeProducts.map((product) => {
    const price =
      stripePrices.find((p) => p.productId === product.id) ||
      stripePrices.find((p) => p.id === product.defaultPriceId);

    return {
      ...product,
      priceId: price?.id,
      unitAmount: price?.unitAmount ?? 1200,
      interval: price?.interval ?? 'month',
      trialPeriodDays: price?.trialPeriodDays ?? 7,
    };
  });

  const paidProduct = products.find((p) => (p.unitAmount ?? 0) > 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name={'Free'}
          price={0}
          interval={'Life'}
          trialDays={'Any registed account'}
          features={['Unlimited Vocabulary Imports', 'Multiple Learner Profiles', 'Email Support']}
        />
        {paidProduct && (
          <PricingCard
            name={paidProduct.name}
            price={paidProduct.unitAmount}
            interval={paidProduct.interval}
            trialDays={paidProduct.trialPeriodDays}
            features={['Everything in Base, and:', 'AI Prioritized Reviews', 'Priority Support']}
            priceId={paidProduct.priceId}
          />
        )}
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number | string;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {typeof trialDays === 'number' ? `with ${trialDays} day free trial` : trialDays}
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100} <span className="text-xl font-normal text-gray-600">/ {interval}</span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-pink-500 mr-2 mt-0.5 shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {price !== 0 && (
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
