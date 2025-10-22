const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '127.0.0.1', // ligação para o próprio PC que redireciona para a VM
  port: 2525,        // porta do anfitrião que reencaminha para a 25 da VM
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

function enviarEmail(destinatario, assunto, corpo) {
  return transporter.sendMail({
    from: 'BemGestar <bemgestar@rodriguessousafernandesrodrigues.pt>',
    to: destinatario,
    subject: assunto,
    text: corpo
  });
}

module.exports = { enviarEmail };
