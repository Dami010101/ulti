const nodemailer = require('nodemailer')


const sendMail = async(subject,message, send_to,sent_from, reply_to) =>
    {
    //create email transporter 
    const transporter = nodemailer.createTransport({

    host: process.env.EMAIL_HOST,
    port: 587,
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    },
    tls:{
        rejectUnauthorized:false
    }
})
//options sending mail
const options= {
    from:sent_from,
    to:send_to,
    replyTo:reply_to,
    subject:subject,
    html:message
}
//send mail

transporter.sendMail(options, function(err,info){
        if (err){
            console.log(err)
        }
        else{
            console.log(info)
        }
})}

module.exports = sendMail

// END OF  sendMAIL FILE 