const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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"
);

const adminEmail = "ngungungu313131@gmail.com";
const adminPassword = "Admin&&&:)))";

const sendMail = (toEmail, sub, htmlContent) => {
  const msg = {
    to: toEmail,
    from: adminEmail, // Use the email address or domain you verified above
    subject: "Verify your account from VNTravel",
    text: sub,
    html: htmlContent,
  };

  sgMail.send(msg).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  );
};
module.exports = sendMail;
