![WordCraft](./public/banner.webp)

# Welcome to WordCraft! 🎨

Hey there! We're thrilled you're here and excited to have you join the WordCraft journey. WordCraft is a friendly language learning platform designed to help you master new vocabulary through interactive and engaging experiences. Whether you're a seasoned developer or just getting started, we've got everything you need to get up and running smoothly.

Let's dive in and get WordCraft running on your machine! ✨

---

## Install Dependencies

First things first, let's install all the packages WordCraft needs to work its magic:

```bash
bun install
```

> **💡 Tip**: All dependencies are automatically managed by [Renovate](https://github.com/renovatebot/renovate), so you'll never have to worry about outdated packages. Pull requests with dependency updates will arrive in your repository like clockwork!

---

## Running WordCraft Locally

Getting WordCraft running on your local machine is a breeze! Just follow these friendly steps, and you'll be learning in no time.

### Step 1: Connect to Stripe 🔗

If you'd like to test payment features (how generous of you to consider upgrading!), you'll need to connect to Stripe. Don't worry, it's super easy!

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

### Step 2: Set Up Your Environment 🏗️

WordCraft needs a few secrets to run properly. We've created a handy setup script that will create your `.env` file automatically:

```bash
bun db:setup
```

### Step 3: Prepare the Database 🗄️

Now let's get your database ready! We'll run migrations and seed it with some starter data:

```bash
bun db:migrate
bun db:seed
```

This will create a test user for you to explore with:

- **Email**: `test@test.com`
- **Password**: `admin123`

> **🎉 Pro tip**: You can always create additional users through the `/sign-up` route whenever you're ready.

### Step 4: Start the Magic! ✨

It's time to launch WordCraft! Run the development server and watch everything come to life:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see WordCraft in action. Welcome to your new language learning adventure!

### Optional: Listen for Stripe Webhooks 🔔

If you're testing subscription features, you might want to listen for Stripe webhooks locally. This helps WordCraft respond to payment events in real-time:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Testing Payments 🧪

Ready to test WordCraft's payment system? We've got you covered! Use these test card details to simulate purchases in our safe sandbox environment:

- **Card Number**: `4242 4242 4242 4242`
- **Expiration**: Any future date (like 12/26, 05/27, etc.)
- **CVC**: Any 3-digit number (123, 456, 789—all work perfectly!)

> **🎈 Note**: These are Stripe's official test card numbers, so you can use them with complete confidence. No real money will be charged, and you can test to your heart's content!

---

## Taking WordCraft to Production 🚀

You've built something amazing locally—now let's share it with the world! Here's your friendly roadmap to deployment.

### Set Up a Production Stripe Webhook 🔧

1. Head over to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (for example: `https://yourdomain.com/api/stripe/webhook`).
3. Choose the events you want WordCraft to listen for—we recommend starting with `checkout.session.completed` and `customer.subscription.updated`.

### Deploy to Vercel ☁️

Vercel makes deploying Next.js applications incredibly smooth. Here's how to get started:

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/)—it's just a few clicks!
3. Follow Vercel's friendly deployment wizard, and it'll guide you through setting everything up perfectly.

### Configure Environment Variables 🔐

In your Vercel project settings (or during deployment), make sure to add all the necessary environment variables. Here's what you'll need:

1. `BASE_URL`: Your production domain (e.g., `https://yourdomain.com`).
2. `STRIPE_SECRET_KEY`: Your Stripe secret key for the production environment.
3. `STRIPE_WEBHOOK_SECRET`: The webhook secret from the production webhook you created earlier.
4. `POSTGRES_URL`: Your production database URL.
5. `AUTH_SECRET`: A random string for authentication. You can generate one easily:
   ```bash
   openssl rand -base64 32
   ```

> **🌟 You're all set!**: Once these are configured, WordCraft will be live and ready to help learners around the world master new languages!

---

**Happy coding, and welcome to the WordCraft community!** 🎉
