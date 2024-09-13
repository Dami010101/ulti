const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async ({ email, subject, message }, res) => {
    try {
        // Mail options for Nodemailer
        const mailOptions = {
            from: process.env.EMAIL_USER, // Make sure to set EMAIL_USER in .env
            to: email,
            subject: subject,
            html: message
        };

        // Set up transporter for Nodemailer
        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail', // or any other service you're using
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: process.env.EMAIL_HOST,
            auth: {
                user: process.env.EMAIL_SECRET,
                pass: process.env.PASS_SECRET
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Send email using nodemailer
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset email sent successfully', data: { email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = sendPasswordResetEmail