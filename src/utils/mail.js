import Mailgen from 'mailgen'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config({
    path : './.env'
})
const sendMail = async (data) => {
    // Configure mailgen by setting a theme and your product info
    console.log(data)
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            // Appears in header & footer of e-mails
            name: 'Task Manager',
            link: 'https://taskmanager.app/'
            // Optional product logo
            // logo: 'https://mailgen.js/img/logo.png'
        }
    });
    // Generate an HTML email with the provided contents
    const emailHtml = mailGenerator.generate(data.options);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    const emailText = mailGenerator.generatePlaintext(data.options);


    // Create a nodemailer transporter instance which is responsible to send a mail
    const transporter = nodemailer.createTransport({
        host: process.env.NODEMAILER_SMTP_HOST,
        port: process.env.NODEMAILER_SMTP_PORT,
        auth: {
            user: process.env.NODEMAILER_SMTP_USERNAME,
            pass: process.env.NODEMAILER_SMTP_PASSWORD,
        },
    });
    const mail = {
        from: "mail.taskmanager@example.com", // We can name this anything. The mail will go to your Mailtrap inbox
        to: data.email, // receiver's mail
        subject: data.subject, // mail subject
        text: emailText, // mailgen content textual variant
        html: emailHtml, // mailgen content html variant
    };
    
      try {
            await transporter.sendMail(mail);
      } catch (error) {
        // As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
        // So it's better to fail silently rather than breaking the app
        console.error(
          "Email service failed silently. Make sure you have provided your MAILTRAP credentials in the .env file",
        );
        console.error("Error: ", error);
      }
}

const resetPasswordMainGenContent = (username, passwordResetUrl) => {
    return {
        body: {
          name: username,
          intro: "We got a request to reset the password of our account",
          action: {
            instructions:
              "To reset your password click on the following button or link:",
            button: {
              color: "#22BC66", // Optional action button color
              text: "Reset password",
              link: passwordResetUrl,
            },
          },
          outro:"Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our app! We're very excited to have you on board.",
            action: {
                instructions:
                    "To verify your email please click on the following button:",
                button: {
                    color: "#22BC66", // Optional action button color
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro:
            "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    }
}


export  {
    sendMail,
    resetPasswordMainGenContent,
    emailVerificationMailgenContent,
}
