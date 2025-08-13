require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const winston = require('./config/winston');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: winston.stream }));

// Rotas
app.use('/auth', require('./routes/auth'));
app.use('/categorias', require('./routes/categorias'));
app.use('/operacoes', require('./routes/operacoes'));
app.use('/despesas-recorrentes', require('./routes/despesasRecorrentes'));
app.use('/dashboard', require('./routes/dashboard'));

// Middleware de tratamento de erros
app.use(errorHandler);

module.exports = app;
