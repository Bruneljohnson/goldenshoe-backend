const nodemailer = require('nodemailer');
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    let newTransport;
    let mailOptions;

    if (process.env.NODE_ENV === 'production') {
      mailOptions = {
        from: process.env.SENDER_EMAIL,
        template_id: options.templateKey,
        personalizations: [
          {
            to: { email: options.email },
            dynamic_template_data: {
              subject: options.subject,
              preheader: options.preheader,
              customer_name: options.name,
              url: options.url,
            },
          },
        ],
        trackingSettings: {
          clickTracking: {
            enable: false,
            enableText: false,
          },
          openTracking: {
            enable: false,
          },
        },
      };

      await sendGridMail.send(mailOptions);
    } else {
      newTransport = nodemailer.createTransport({
        host: process.env.DUMMY_HOST,
        port: process.env.DUMMY_PORT,
        auth: {
          user: process.env.DUMMY_USERNAME,
          pass: process.env.DUMMY_PASSWORD,
        },
      });

      mailOptions = {
        from: `Brunel Johnson <${process.env.SENDER_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
      };

      await newTransport.sendMail(mailOptions);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = sendEmail;
