const nodemailer = require('nodemailer');

// Configuração do transporte de email
const createTransporter = () => {
  // Verificar se as configurações SMTP estão definidas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('⚠️  AVISO: Configurações SMTP não definidas no arquivo .env');
    console.error('Configure SMTP_HOST, SMTP_USER e SMTP_PASS para usar recuperação de senha.');
    throw new Error('Configurações de email não encontradas. Configure o arquivo .env com suas credenciais SMTP.');
  }

  // Para desenvolvimento, use um serviço como Mailtrap, Ethereal ou Gmail
  // Para produção, configure um serviço SMTP real
  
  if (process.env.NODE_ENV === 'production') {
    // Configuração para produção (ex: Gmail, SendGrid, AWS SES)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Para desenvolvimento, cria conta de teste no Ethereal
    // Os emails não são enviados de verdade, mas você pode visualizá-los
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
};

/**
 * Envia email de recuperação de senha
 * @param {string} to - Email do destinatário
 * @param {string} resetToken - Token de reset
 * @param {string} userName - Nome do usuário
 */
const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    
    // URL base da aplicação
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken}`;
    
    // Configuração do email
    const mailOptions = {
      from: `"EventFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: 'Recuperação de Senha - EventFlow',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 15px 0;
              color: #555;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #777;
              font-size: 12px;
            }
            .warning {
              color: #dc3545;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EventFlow</h1>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Olá, ${userName}!</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no EventFlow.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
              </div>
              
              <div class="info-box">
                <strong>Informações importantes:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Este link é válido por apenas 1 hora</li>
                  <li>Se você não solicitou esta redefinição, ignore este email</li>
                  <li>Sua senha atual permanecerá a mesma</li>
                </ul>
              </div>
              
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #667eea; font-size: 14px;">
                ${resetUrl}
              </p>
              
              <p class="warning">
                <strong>Atenção:</strong> Nunca compartilhe este link com outras pessoas. 
                Nossa equipe nunca pedirá sua senha por email ou telefone.
              </p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; 2025 EventFlow. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Olá, ${userName}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta no EventFlow.
        
        Clique no link abaixo para criar uma nova senha:
        ${resetUrl}
        
        Este link é válido por apenas 1 hora.
        
        Se você não solicitou esta redefinição, ignore este email. Sua senha atual permanecerá a mesma.
        
        Atenção: Nunca compartilhe este link com outras pessoas.
        
        EventFlow - Sistema de Gerenciamento de Eventos
      `
    };
    
    // Envia o email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email de recuperação enviado:', info.messageId);
    
    // Se estiver usando Ethereal para teste, mostra o link de preview
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de recuperação');
  }
};

/**
 * Envia email de confirmação de alteração de senha
 * @param {string} to - Email do destinatário
 * @param {string} userName - Nome do usuário
 */
const sendPasswordChangedEmail = async (to, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"EventFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: 'Senha Alterada com Sucesso - EventFlow',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .success { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EventFlow</h1>
            </div>
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              <p class="success">Sua senha foi alterada com sucesso!</p>
              <p>Sua senha da conta EventFlow foi redefinida. Se você não realizou esta alteração, entre em contato conosco imediatamente.</p>
              <p>Por segurança, recomendamos:</p>
              <ul>
                <li>Não compartilhar sua senha com ninguém</li>
                <li>Usar uma senha forte e única</li>
                <li>Fazer logout de dispositivos não utilizados</li>
              </ul>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Se você não solicitou esta alteração, entre em contato imediatamente.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    // Não lança erro para não bloquear o reset de senha
    return { success: false };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
