const mongoose = require('mongoose');
const { Types } = mongoose;
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const getTransaction = async (req, res, next) => {
  const body = req.body;
  const { customerId } = req.params; //targetCustomer
  const targetCustomer = await Customer.findById(customerId);
  let mainCustomer = req.customer; //mainCustomer
  const targetCustomerId = targetCustomer.id;
  let targetCustomerBalance = targetCustomer.balance;
  const mainCustomerId = mainCustomer.id;
  let mainCustomerBalance = mainCustomer.balance;
  
  if (body.accountTransfer) {
    //saque da conta referencia
    if (mainCustomerBalance >= body.accountTransfer) {
      let transferValue = body.accountTransfer;
      let balanceWithdraw = mainCustomerBalance - transferValue;
      Customer.findByIdAndUpdate({ _id: Types.ObjectId(mainCustomerId) }, { balance: balanceWithdraw, updatedAt: new Date() } , (err, result) => {
        if(err) {
          return res.send(err);
        }
        //deposito na conta alvo
        let balanceDeposit = targetCustomerBalance + transferValue;
        return Customer.findByIdAndUpdate({ _id: Types.ObjectId(targetCustomerId) }, { balance: balanceDeposit, updatedAt: new Date() } , (err, result) => {
          if(err) {
            return res.send(err);
          }
          //criar uma transação
          const createTransaction = new Transaction({
            _customer: mainCustomer,
            type: 'account_transfer',
            status: 'accepted',
            amount: transferValue,
            toCustomer: targetCustomer,
            createdAt: new Date()
          });
          createTransaction.save((function (err, result) {
            if (err) return console.log(err);
            // saved!
            res.send(result);
          }));
        });
      });
    } else {
      return res.status(400).send({ error: 'Você não possui saldo suficiente!' });
    }
  } else if (body.portfolioTransfer) {
    let mainPortfolioAmount = null;
    let targetPortfolioAmount = null;
    const mainPortfolioId = req.body.mainPortfolioId;
    const targetPortfolioId = req.body.targetPortfolioId;
    const arrayMainPortfolios = mainCustomer.portfolios;
    const arrayTargetPortfolios = targetCustomer.portfolios;
    arrayMainPortfolios.map(function (item, index) {
      if (item.id == mainPortfolioId) {
        mainPortfolioAmount = item.amount;
        return mainPortfolioAmount;
      }
    });
    arrayTargetPortfolios.map(function (item, index) {
      if (item.id == targetPortfolioId) {
        targetPortfolioAmount = item.amount;
        return targetPortfolioAmount;
      }
    });
    //saque do portfolio referencia
    if (mainPortfolioAmount >= body.portfolioTransfer) {
      let transferValue = body.portfolioTransfer;
      let balanceWithdraw = mainPortfolioAmount - transferValue;
      Customer.updateOne(
        { _id: Types.ObjectId(mainCustomerId), "portfolios._id": mainPortfolioId },
        { $set: { "portfolios.$.amount" : balanceWithdraw } },
        function(err, result) {
          if (err) {
            return res.send(err);
          } 
          let balanceDeposit = targetPortfolioAmount + transferValue;
          return Customer.updateOne(
            { _id: Types.ObjectId(targetCustomerId), "portfolios._id": targetPortfolioId }, 
            { $set: { "portfolios.$.amount" : balanceDeposit, "portfolios.$.updatedAt": new Date()} } , 
            (err, result) => {
              if(err) {
                return res.send(err);
              }
              //criar uma transação
              const createTransaction = new Transaction({
                _customer: mainCustomer,
                type: 'portfolio_transfer',
                status: 'accepted',
                amount: transferValue,
                fromPortfolio: mainPortfolioId,
                toCustomer: targetCustomer,
                createdAt: new Date()
              });
              createTransaction.save((function (err, result) {
                if (err) return console.log(err);
                // saved!
                res.send(result);
              }));
            });
        });
    } else {
      return res.status(400).send({ error: 'Você não possui saldo suficiente!' });
    }
  }
  next();
}
module.exports = getTransaction;