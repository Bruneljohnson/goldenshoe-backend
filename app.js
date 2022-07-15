const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const pug = require('pug');
const path = require('path');

//----------Security---------------//
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitise = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

//----------Utilities---------------//
const AppError = require('./utilities/AppError');
const globalErrorHandler = require('./utilities/GlobalError');

//---------Routers---------------//
const userRouter = require('./routes/userRoutes');
const shoeRouter = require('./routes/shoeRoutes');
const orderRouter = require('./routes/orderRoutes');
const ticketRouter = require('./routes/ticketRoutes');
const viewRouter = require('./routes/viewRoutes');

//----------Create Server-------------//
const app = express();

//----------Template Engine-------------//
// SET TEMPLATING ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//----------Global Middleware-------------//

// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Implement CORS and Security Headers in API Requests
const whitelist = ['http://localhost:3000', 'https://bruneljohnson.github.io'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
  credentials: true,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));

// Log request in dev
process.env.NODE_ENV === 'development' && app.use(morgan('dev'));

// Limit no. requests from one IP Address
const limiter = rateLimit({
  max: 1000,
  windowMS: 60 * 60 * 1000,
  message:
    'Too many requests from this IP Address, please try again in 90mins.',
});

app.use('/api', limiter);

//Webhook Route As it has to come before express.json
app.use('/api/v1/order/webhook', express.raw({ type: '*/*' }), orderRouter);
//Parse incoming JSON data to use in req.body
app.use(express.json({ limit: '20kb' }));

//Sanitisation against NoSQL Injection Queries and XSS Attacks
app.use(mongoSanitise());
app.use(xssClean());

//Compress request/response cycle
app.use(compression());

//----------Sub-Routes-------------//
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/shoes', shoeRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/tickets', ticketRouter);

//----------GLOBAL HANDLING & 404 ROUTE-------------//
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this Server`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
