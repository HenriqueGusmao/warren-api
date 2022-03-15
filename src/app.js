const express = require('express');
const Customer = require('./models/Customer');
const getCustomer = require('./middlewares/getCustomer');
const getTransaction = require('./middlewares/getTransaction');
const Transaction = require('./models/Transaction');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const { Types } = mongoose;
app.use(bodyParser.json());

//inserir o status de quando listou ou deu erro
app.get('/portfolios/:id', getCustomer, async (req, res, next) => {
  const arrayPortfolios = req.customer.portfolios;
  const { id } = req.params;

  arrayPortfolios.map(function (item, index) {
    if (item.id == id) {
      return res.json(item);
    }
  });

  next();
});

//inserir o status de quando listou ou deu erro
app.get('/portfolios/goalReached', getCustomer, async (req, res) => {
  const arrayPortfolios = req.customer.portfolios;
  let goalsPortfolios = [];
  
  arrayPortfolios.map(function (item, index) {
    if (item.amount >= item.goalAmount) {
      goalsPortfolios[index] = item ;
    }
  });

  res.json(goalsPortfolios);
});

app.get('/transactions/deposits/', getCustomer, async (req, res) => {
  const { id } = req.customer;
  const { status, startDate, endDate } = req.query;

  Transaction.find(
    {
      _customer : { $eq : id },
      type : { $eq : 'deposit' },
      status : { $eq : status },
      createdAt : { $gte : new Date(startDate), $lt: new Date(endDate) },
    }
  ).then(transaction => {
    res.json(transaction);
  });
});

//enviar o status de quando inseriu e se deu erro na inserção / ajustar fuso-horario da atualização
app.post('/transactions/deposit', getCustomer, async (req, res) => {
  let { id, balance } = req.customer;
  const deposit = req.body.balance;
  balance = balance + deposit;
  
  Customer.findByIdAndUpdate({ _id: Types.ObjectId(id) }, { balance: balance, updatedAt: new Date() } , function(err, result) {
    if(err){
      res.send(err);
    }
    else{
      res.send(result);
    }
  });
});

app.post('/transactions/account-transfer/:customerId', getCustomer, getTransaction, async (req, res) => {

});

app.post('/transactions/portfolio-transfer/:customerId', getCustomer, getTransaction, async (req, res) => {

});

app.get('/transactions/topAllocationAmount?page=<integer>&pageSize=<integer>', getCustomer, async (req, res) => {
  const { id } = req.params
  const portfolio = await Customer.findOne({ '_id': id })
  res.json(portfolio)
});

app.get('/transactions/topCashChurn?page=<integer>&pageSize=<integer>&start=<date>&end=<date>', getCustomer, async (req, res) => {
  const { id } = req.params
  const portfolio = await Customer.findOne({ '_id': id })
  res.json(portfolio)
});

module.exports = app
