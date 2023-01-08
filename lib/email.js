const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = () => {
    const mailTransport = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const from = '"New York Travel" <polycarpnwaeke4@gmail.com> ';
    const errorRecipient = "polycarpnwaeke4@gmail.com";

    return {
        send: (to, subj, body) => {
            mailTransport
                .sendMail({
                    from: from,
                    to: to,
                    subject: subj,
                    html: body,
                    generateTextFromHtml: true,
                })
                .then(() => console.log(`Email successfully sent to ${to}`))
                .catch(() => console.error(`Email to ${to} was unsuccessful`));
        },
        emailError: (message, filename, exception, subj) => {
            let body =
                "<h1>New York Travel Site Error</h1>" +
                "message:<br><pre>" +
                message +
                "</pre><br>";

            if (exception)
                body += "exception:<br><pre>" + exception + "</pre><br>";

            if (filename)
                body += "filename:<br><pre>" + filename + "</pre><br>";

            mailTransport
                .sendMail({
                    from: from,
                    to: errorRecipient,
                    subject: subj || "New York Travel Site Error",
                    html: body,
                    generateTextFromHtml: true,
                })
                .then(() => console.log("Successfully sent Error Email"))
                .catch(() => console.error("Unable to send Error Email"));
        },
    };
};
