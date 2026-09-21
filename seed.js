require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const BlogPost = require('./models/BlogPost');
const PayoutProof = require('./models/PayoutProof');

const now = new Date();

const users = [
  {
    username: 'mika_earn',
    email: 'mika@example.com',
    balances: { tokens: 8200, cash: 13.4 },
    stats: { totalClaims: 124345, totalEarned: 1672.6, offerwallsCompleted: 4, shortlinksCompleted: 21, microTasksCompleted: 7, lastClaimAt: now }
  },
  {
    username: 'cashpilot',
    email: 'cashpilot@example.com',
    balances: { tokens: 4100, cash: 7.9 },
    stats: { totalClaims: 88454, totalEarned: 34341.2, offerwallsCompleted: 2, shortlinksCompleted: 19, microTasksCompleted: 3, lastClaimAt: now }
  },
  {
    username: 'web3nora',
    email: 'nora@example.com',
    balances: { tokens: 15200, cash: 28.6 },
    stats: { totalClaims: 20535, totalEarned: 86.9, offerwallsCompleted: 9, shortlinksCompleted: 32, microTasksCompleted: 11, lastClaimAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
  }
];

const payouts = [
  { username: 'mika_earn', amount: 7.25, currency: 'USD', method: 'FaucetPay', paidAt: new Date(Date.now() - 8 * 60 * 1000) },
  { username: 'cashpilot', amount: 18.9, currency: 'USD', method: 'Paystack', paidAt: new Date(Date.now() - 18 * 60 * 1000) },
  { username: 'web3nora', amount: 4.6, currency: 'USD', method: 'USDT', paidAt: new Date(Date.now() - 33 * 60 * 1000) },
  { username: 'taskmax', amount: 12.15, currency: 'USD', method: 'FaucetPay', paidAt: new Date(Date.now() - 52 * 60 * 1000) },
  { username: 'gainloop', amount: 22.4, currency: 'USD', method: 'Binance Pay', paidAt: new Date(Date.now() - 73 * 60 * 1000) }
];

const posts = [
  {
    title: 'How to Build a Daily Faucet Routine That Actually Pays',
    slug: 'daily-faucet-routine-that-pays',
    excerpt: 'A practical routine for stacking faucet claims, shortlinks, and partner rewards without wasting your best earning windows.',
    coverImage: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=1200&q=80',
    category: 'Earning Strategy',
    tags: ['faucet', 'routine', 'rewards'],
    readTime: 6,
    status: 'published',
    isSticky: true,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    content: `
      <p>Daily faucet income grows when users treat the platform like a short, repeatable checklist instead of a random click session. The goal is to claim on time, reserve attention for higher-value tasks, and keep withdrawal rules in mind from the beginning.</p>
      <h2>Start with the claim timer</h2>
      <p>Log in when your faucet timer resets and claim before moving into longer activities. This keeps your base rewards compounding while you decide which offerwalls or tasks are worth the time.</p>
      <h2>Stack shortlinks selectively</h2>
      <p>Shortlinks work best when you prioritize walls with reliable crediting and clear completion instructions. If a partner route feels broken, skip it and protect your earning time.</p>
      <h2>Track payout methods early</h2>
      <p>Choose your withdrawal method before you reach the threshold. That helps you understand minimums, network fees, and any extra review requirements.</p>
    `
  },
  {
    title: 'FaucetPay vs Paystack: Choosing the Right Withdrawal Method',
    slug: 'faucetpay-vs-paystack-withdrawal-method',
    excerpt: 'Compare payout speed, convenience, and typical use cases for two popular withdrawal paths.',
    coverImage: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80',
    category: 'Withdrawals',
    tags: ['faucetpay', 'paystack', 'payments'],
    readTime: 5,
    status: 'published',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    content: `
      <p>Withdrawal choice affects how quickly rewards become usable. FaucetPay is often convenient for crypto-native users, while Paystack can be a better fit when local cash rails are available.</p>
      <h2>When FaucetPay makes sense</h2>
      <p>Use FaucetPay when you prefer crypto balances, smaller withdrawals, and a familiar faucet ecosystem. Always confirm wallet details before submitting a request.</p>
      <h2>When Paystack makes sense</h2>
      <p>Paystack is useful for cash-focused users who want local settlement options. Processing rules vary by region, so check your dashboard before relying on a deadline.</p>
    `
  },
  {
    title: 'Offerwall Safety: How to Avoid Rejected Rewards',
    slug: 'offerwall-safety-avoid-rejected-rewards',
    excerpt: 'Simple rules that help keep survey, app install, and trial rewards eligible for approval.',
    coverImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
    category: 'Offerwalls',
    tags: ['offerwalls', 'surveys', 'compliance'],
    readTime: 7,
    status: 'published',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    content: `
      <p>Offerwall rewards are larger because advertisers verify user quality. Following instructions closely is the best way to protect your credits.</p>
      <h2>Use accurate information</h2>
      <p>Survey mismatches, emulator traffic, and repeated device resets are common reasons partner networks reject rewards.</p>
      <h2>Keep proof when needed</h2>
      <p>For app installs or trials, screenshots and confirmation emails can help support teams investigate delayed credits.</p>
    `
  },
  {
    title: 'Micro Tasks That Convert Spare Time Into Cash',
    slug: 'micro-tasks-spare-time-cash',
    excerpt: 'Learn how admin-approved tasks can fill earning gaps between faucet timers and partner rewards.',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    category: 'Micro Tasks',
    tags: ['tasks', 'cash', 'productivity'],
    readTime: 4,
    status: 'published',
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    content: `
      <p>Micro tasks are useful because they are controlled by the platform team and can be reviewed with clear evidence. They are ideal when you have short earning windows.</p>
      <h2>Read the acceptance criteria</h2>
      <p>Before starting, check the proof requirements and deadline. Submissions that match the brief are approved faster.</p>
      <h2>Batch similar tasks</h2>
      <p>Completing similar tasks together lowers context switching and helps you build a reliable rhythm.</p>
    `
  }
];

async function upsertByField(Model, field, records) {
  if (records.length === 0) return;

  await Model.bulkWrite(records.map((record) => ({
    updateOne: {
      filter: { [field]: record[field] },
      update: { $set: record },
      upsert: true
    }
  })));
}

async function seed() {
  await connectDB();
  await upsertByField(User, 'username', users);
  await upsertByField(BlogPost, 'slug', posts);
  await upsertByField(PayoutProof, 'username', payouts);
  console.log('Seed data inserted or updated successfully.');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
