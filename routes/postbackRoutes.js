const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user.model');
const Transaction = require('../models/TranCPX');

// MD5 Hash verification matching CPX formula: trans_id-user_id-amount_local-status-secure_hash
const verifyCPXHash = (transId, userId, amount, status, secureHash, incomingHash) => {
  const hashString = `${transId}-${userId}-${amount}-${status}-${secureHash}`;
  const computedHash = crypto.createHash('md5').update(hashString).digest('hex');
  return computedHash.toLowerCase() === incomingHash.toLowerCase();
};

const handleCPXPostback = async (req, res) => {
  try {
    const payload = req.method === 'POST' ? req.body : req.query;

    const transId = payload.trans_id;
    // Captures {user_id} parameter sent by CPX
    const userId = payload.user_id || payload.ext_user_id; 
    const amountLocal = parseFloat(payload.amount_local || payload.amount || 0);
    const status = String(payload.status); // '1' = credited, '2' = reversed
    const incomingHash = payload.hash;
    const clientIp = payload.ip_click || payload.ip || '';

    // 1. Mandatory Parameter Validation
    if (!userId) {
      console.error('[CPX Postback Error] Missing user_id parameter');
      return res.status(400).send('ERROR_MISSING_USER_ID');
    }

    if (!transId || isNaN(amountLocal) || !status) {
      return res.status(400).send('ERROR_MISSING_PARAMETERS');
    }

    // 2. Hash Security Check
    if (process.env.CPX_SECURE_HASH && incomingHash) {
      const isValid = verifyCPXHash(
        transId,
        userId,
        amountLocal,
        status,
        process.env.CPX_SECURE_HASH,
        incomingHash
      );
      if (!isValid) {
        console.warn(`[CPX Postback] Security hash mismatch for user ${userId}, tx ${transId}`);
        return res.status(403).send('ERROR_INVALID_HASH');
      }
    }

    // 3. Find Target User in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[CPX Postback Error] User ID ${userId} not found in database`);
      return res.status(404).send('ERROR_USER_NOT_FOUND');
    }

    const existingTx = await Transaction.findOne({ transactionId: transId });

    // 4. Handle Crediting (status === '1')
    if (status === '1') {
      if (existingTx) {
        return res.status(200).send('OK_DUPLICATE_IGNORED');
      }

      await Transaction.create({
        transactionId: transId,
        userId: user._id,
        amount: amountLocal,
        ip: clientIp,
        status: 'completed'
      });

      user.balance += amountLocal;
      await user.save();

      return res.status(200).send('OK');
    }

    // 5. Handle Reversal (status === '2')
    if (status === '2') {
      if (existingTx && existingTx.status === 'reversed') {
        return res.status(200).send('OK_ALREADY_REVERSED');
      }

      if (existingTx) {
        existingTx.status = 'reversed';
        await existingTx.save();
      } else {
        await Transaction.create({
          transactionId: transId,
          userId: user._id,
          amount: amountLocal,
          ip: clientIp,
          status: 'reversed'
        });
      }

      user.balance = Math.max(0, user.balance - amountLocal);
      await user.save();

      return res.status(200).send('OK');
    }

    return res.status(400).send('ERROR_INVALID_STATUS');

  } catch (error) {
    console.error('CPX Postback Internal Error:', error);
    return res.status(500).send('ERROR_INTERNAL_SERVER');
  }
};

router.get('/postback', handleCPXPostback);
router.post('/postback', handleCPXPostback);

module.exports = router;