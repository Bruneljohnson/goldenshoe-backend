const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');
const Shoe = require('../models/shoeModel');
const AppError = require('../utilities/AppError');
const APIFeatures = require('../utilities/APIFeatures');

//----------STRIPE-------------//
exports.getCheckoutSession = async (req, res, next) => {
  try {
    const customer = await stripe.customers.create({
      email: req.user.email,
      metadata: {
        user: req.user.id,
        cart: JSON.stringify(req.body.shoes),
      },
    });

    req.user.cart = JSON.stringify(req.body.shoes);

    const line_items = req.body.shoes.map((shoe) => {
      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: shoe.title,
            images: [shoe.image],
            description: shoe.description,
            metadata: {
              size: shoe.size,
              id: shoe._id,
              colour: shoe.colour,
            },
          },
          unit_amount: shoe.price * 100,
        },
        quantity: shoe.quantity,
      };
    });

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'gbp',
            },
            display_name: 'Free shipping',
            // Delivers between 5-7 business days
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'gbp',
            },
            display_name: 'Next day air',
            // Delivers in exactly 1 business day
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 1,
              },
            },
          },
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      line_items,
      mode: 'payment',
      customer: customer.id,
      success_url: `https://bruneljohnson.github.io/goldenshoe/checkout-success`,
      cancel_url: `https://bruneljohnson.github.io/goldenshoe/cart`,
    });

    // 3) Create session as response

    res.send({ url: session.url });
  } catch (err) {
    next(err);
  }
};

// Create Order Document
const createOrder = async (customer, data) => {
  try {
    const items = JSON.parse(customer.metadata.cart);

    const shoes = await Promise.all(
      items.map(async (item) => {
        const shoeStock = await Shoe.findById(item.id);

        const currentSize = shoeStock.sizes.find((shoe) => {
          if (shoe.size.toString() === item.size.toString()) return true;
        });

        if (currentSize.quantity <= 0) {
          currentSize.quantity = 0;
        } else {
          currentSize.quantity -= item.quantity;
          shoeStock.countInStock -= item.quantity;
        }

        const filter = shoeStock.sizes.filter(
          (size) => size.size.toString() !== currentSize.size.toString()
        );
        shoeStock.sizes = [...filter, currentSize];

        try {
          shoeStock.markModified('sizes');
          await shoeStock.save();
        } catch (err) {
          return new AppError(`Unable to update Database ${err.message}.`, 400);
        }

        return {
          shoe: item.id,
          size: item.size,
          quantity: item.quantity,
        };
      })
    );

    await Order.create({
      user: customer.metadata.user,
      customer: data.customer,
      paymentIntent: data.payment_intent,
      shoes,
      amount: data.amount_total,
      shipping: data.customer_details,
      status: data.payment_status,
    });
  } catch (err) {
    return new AppError(
      `Unable to create Order in Database ${err.message}.`,
      400
    );
  }
};

// Stripe webhoook

exports.webhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Webhook Verified');
    } catch (err) {
      console.log(`Webhook error: ${err.message}`);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      stripe.customers
        .retrieve(event.data.object.customer)
        .then(async (customer) => {
          try {
            // CREATE ORDER
            createOrder(customer, event.data.object);
          } catch (err) {
            console.log(typeof createOrder);
            console.log(err);
          }
        });
    }

    res.status(200).json({ recieved: true });
  } catch (err) {
    next(err);
  }
};

//----------HANDLERS------------//
exports.getAllOrders = async (req, res, next) => {
  try {
    const ApiFeatures = new APIFeatures(
      Order.find({ user: req.user.id }),
      req.query
    )
      .filter()
      .sort()
      .fields()
      .paginate();
    const orders = await ApiFeatures.query;
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError("order doesn't exist.", 404));

    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(err);
  }
};
