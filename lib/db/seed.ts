import * as readline from 'readline';
import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function createStripeProducts() {
  console.warn('Creating Stripe products and prices...');

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.warn('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    email,
    passwordHash,
  });

  console.warn('Initial user created.');

  const shouldCreateStripeProducts = await confirm('Do you want to create Stripe products?');

  if (shouldCreateStripeProducts) {
    await createStripeProducts();
  } else {
    console.warn('Skipping Stripe product creation.');
  }
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.warn('Seed process finished. Exiting...');
    process.exit(0);
  });
