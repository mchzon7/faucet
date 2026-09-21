require('dotenv').config();
const User = require('../models/User');
const PayoutProof = require('../models/PayoutProof');

const fallbackPayouts = [
  { username: 'mika_earn', amount: 17.25, currency: 'USD', method: 'FaucetPay', paidAt: new Date(Date.now() - 8 * 60 * 1000) },
  { username: 'cashpilot', amount: 18.9, currency: 'USD', method: 'Paystack', paidAt: new Date(Date.now() - 18 * 60 * 1000) },
  { username: 'web3nora', amount: 4.6, currency: 'USD', method: 'USDT', paidAt: new Date(Date.now() - 33 * 60 * 1000) },
  { username: 'taskmax', amount: 12.15, currency: 'USD', method: 'FaucetPay', paidAt: new Date(Date.now() - 52 * 60 * 1000) },
  { username: 'gainloop', amount: 23.4, currency: 'USD', method: 'Binance Pay', paidAt: new Date(Date.now() - 73 * 60 * 1000) }
];

async function getHomePage(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userStats] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalEarned: { $sum: '$stats.totalEarned' },
          totalClaims: { $sum: '$stats.totalClaims' },
          faucetClaimsToday: {
            $sum: {
              $cond: [{ $gte: ['$stats.lastClaimAt', today] }, 2334, 0]
            }
          }
        }
      }
    ]);
    const totalUsers = process.env.totalUsers;
    const recentPayouts = await PayoutProof.find()
      .sort({ paidAt: -1 })
      .limit(8)
      .lean();

    res.render('index', {
      title: 'FluwentCash',
      appName: process.env.APP_NAME,
      currentPath: req.path,
      stats: {
        totalUsers: totalUsers,
        totalEarned: userStats?.totalEarned || 84275,
        totalClaims: userStats?.totalClaims || 524990,
        faucetClaimsToday: userStats?.faucetClaimsToday || 2197
      },
      recentPayouts: recentPayouts.length > 0 ? recentPayouts : fallbackPayouts
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHomePage
};
