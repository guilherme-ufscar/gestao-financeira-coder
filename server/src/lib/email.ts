import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Cofrin <noreply@gestaofinanceira.codermaster.com.br>';

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const appUrl = process.env.APP_URL || 'https://gestaofinanceira.codermaster.com.br';
  const resetUrl = appUrl + '/redefinir-senha?token=' + token;
  const html = [
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">',
    '<h2 style="color: #6D5FFD;">Cofrin</h2>',
    '<p>Voce solicitou a recuperacao de senha.</p>',
    '<p>Clique no botao abaixo para redefinir sua senha:</p>',
    '<a href="' + resetUrl + '" style="display: inline-block; padding: 12px 24px; background: #6D5FFD; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">',
    'Redefinir senha</a>',
    '<p style="color: #666; font-size: 12px;">Este link expira em 1 hora. Se voce nao solicitou, ignore este e-mail.</p>',
    '</div>',
  ].join('');
  return sendEmail(to, 'Recuperacao de senha - Cofrin', html);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.APP_URL || 'https://gestaofinanceira.codermaster.com.br';
  const html = [
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">',
    '<h2 style="color: #6D5FFD;">Bem-vindo ao Cofrin!</h2>',
    '<p>Ola ' + name + ',</p>',
    '<p>Sua conta foi criada com sucesso. Comece a organizar suas financas agora.</p>',
    '<a href="' + appUrl + '" style="display: inline-block; padding: 12px 24px; background: #6D5FFD; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">',
    'Acessar o Cofrin</a>',
    '</div>',
  ].join('');
  return sendEmail(to, 'Bem-vindo ao Cofrin!', html);
}

export async function sendCircleInviteEmail(to: string, inviterName: string, circleName: string) {
  const appUrl = process.env.APP_URL || 'https://gestaofinanceira.codermaster.com.br';
  const html = [
    '<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">',
    '<h2 style="color: #6D5FFD;">Cofrin - Convite para circulo familiar</h2>',
    '<p>' + inviterName + ' convidou voce para participar do circulo familiar <strong>' + circleName + '</strong>.</p>',
    '<a href="' + appUrl + '/familia/convites" style="display: inline-block; padding: 12px 24px; background: #6D5FFD; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">',
    'Ver convite</a>',
    '</div>',
  ].join('');
  return sendEmail(to, 'Convite para ' + circleName + ' - Cofrin', html);
}
