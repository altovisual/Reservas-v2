const nodemailer = require('nodemailer');

// Configurar transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Usar contraseña de aplicación de Google
    }
  });
};

// Plantilla base de email
const getEmailTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
    .content { padding: 30px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 12px; margin: 5px 0; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; }
    .value { font-weight: 600; color: #111827; }
    .total { font-size: 24px; color: #10b981; font-weight: bold; }
    .highlight { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .highlight-icon { font-size: 20px; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💅 Nail Spa</h1>
      <p>Tu destino de belleza</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Nail Spa - Yaracuy, Venezuela</p>
      <p>Este es un correo automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

// Enviar factura de pago confirmado
const enviarFactura = async (cita, pago) => {
  try {
    const transporter = createTransporter();
    
    const fechaCita = new Date(cita.fechaCita).toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const serviciosHTML = cita.servicios?.map(s => `
      <div class="info-row">
        <span class="label">${s.nombreServicio}</span>
        <span class="value">$${s.precio}</span>
      </div>
    `).join('') || '';

    const content = `
      <h2 style="color: #111827; margin-bottom: 5px;">¡Pago Confirmado! ✅</h2>
      <p style="color: #6b7280;">Gracias por tu pago, ${cita.nombreCliente}. Aquí está tu comprobante:</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">📋 Detalles de la Cita</h3>
        <div class="info-row">
          <span class="label">Fecha:</span>
          <span class="value">${fechaCita}</span>
        </div>
        <div class="info-row">
          <span class="label">Hora:</span>
          <span class="value">${cita.horaInicio} - ${cita.horaFin}</span>
        </div>
        <div class="info-row">
          <span class="label">Especialista:</span>
          <span class="value">${cita.nombreEspecialista || 'Por asignar'}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">💇‍♀️ Servicios</h3>
        ${serviciosHTML}
        <div class="info-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #10b981;">
          <span class="label" style="font-size: 18px;">Total:</span>
          <span class="total">$${cita.total}</span>
        </div>
      </div>

      <div class="info-box" style="background: #eff6ff; border-color: #bfdbfe;">
        <h3 style="margin-top: 0; color: #1d4ed8;">💳 Información del Pago</h3>
        <div class="info-row">
          <span class="label">Método:</span>
          <span class="value">${pago?.metodoPago || 'No especificado'}</span>
        </div>
        <div class="info-row">
          <span class="label">Referencia:</span>
          <span class="value">${pago?.referencia || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Estado:</span>
          <span class="value" style="color: #10b981;">✓ Confirmado</span>
        </div>
      </div>

      <div class="highlight">
        <span class="highlight-icon">⏰</span>
        <strong>Recuerda:</strong> Llega 5-10 minutos antes de tu cita para una mejor experiencia.
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'https://nailspa-reservas.vercel.app'}/mis-citas" class="btn">
          Ver mis citas
        </a>
      </p>
    `;

    const mailOptions = {
      from: `"Nail Spa" <${process.env.EMAIL_USER}>`,
      to: cita.email,
      subject: `✅ Pago Confirmado - Cita ${fechaCita}`,
      html: getEmailTemplate(content, 'Factura - Nail Spa')
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Factura enviada a ${cita.email}`);
    return true;
  } catch (error) {
    console.error('Error enviando factura:', error.message);
    return false;
  }
};

// Enviar recordatorio de cita
const enviarRecordatorio = async (cita) => {
  try {
    const transporter = createTransporter();
    
    const fechaCita = new Date(cita.fechaCita).toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const serviciosLista = cita.servicios?.map(s => s.nombreServicio).join(', ') || 'Servicio de belleza';

    const content = `
      <h2 style="color: #111827; margin-bottom: 5px;">⏰ ¡Tu cita es en 20 minutos!</h2>
      <p style="color: #6b7280;">Hola ${cita.nombreCliente}, te recordamos que tienes una cita próximamente.</p>
      
      <div class="highlight" style="background: #fef3c7; text-align: center; padding: 25px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">Tu cita comienza a las</p>
        <p style="margin: 10px 0; font-size: 36px; font-weight: bold; color: #d97706;">${cita.horaInicio}</p>
        <p style="margin: 0; font-size: 14px; color: #92400e;">¡No llegues tarde! 💅</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">📋 Detalles de tu Cita</h3>
        <div class="info-row">
          <span class="label">Fecha:</span>
          <span class="value">${fechaCita}</span>
        </div>
        <div class="info-row">
          <span class="label">Hora:</span>
          <span class="value">${cita.horaInicio} - ${cita.horaFin}</span>
        </div>
        <div class="info-row">
          <span class="label">Servicios:</span>
          <span class="value">${serviciosLista}</span>
        </div>
        <div class="info-row">
          <span class="label">Especialista:</span>
          <span class="value">${cita.nombreEspecialista || 'Por asignar'}</span>
        </div>
        <div class="info-row">
          <span class="label">Total:</span>
          <span class="value" style="color: #10b981; font-size: 18px;">$${cita.total}</span>
        </div>
      </div>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 10px; color: #065f46;">📍 <strong>Ubicación:</strong></p>
        <p style="margin: 0; color: #047857;">Nail Spa - Yaracuy, Venezuela</p>
      </div>

      <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
        ¿Necesitas reagendar? Contáctanos lo antes posible.
      </p>
    `;

    const mailOptions = {
      from: `"Nail Spa" <${process.env.EMAIL_USER}>`,
      to: cita.email,
      subject: `⏰ Recordatorio: Tu cita es en 20 minutos - ${cita.horaInicio}`,
      html: getEmailTemplate(content, 'Recordatorio de Cita - Nail Spa')
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Recordatorio enviado a ${cita.email}`);
    return true;
  } catch (error) {
    console.error('Error enviando recordatorio:', error.message);
    return false;
  }
};

// Enviar confirmación de cita nueva
const enviarConfirmacionCita = async (cita) => {
  try {
    const transporter = createTransporter();
    
    const fechaCita = new Date(cita.fechaCita).toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const serviciosLista = cita.servicios?.map(s => `${s.nombreServicio} - $${s.precio}`).join('<br>') || 'Servicio de belleza';

    const content = `
      <h2 style="color: #111827; margin-bottom: 5px;">🎉 ¡Cita Reservada!</h2>
      <p style="color: #6b7280;">Hola ${cita.nombreCliente}, tu cita ha sido registrada exitosamente.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">📋 Detalles de tu Cita</h3>
        <div class="info-row">
          <span class="label">Fecha:</span>
          <span class="value">${fechaCita}</span>
        </div>
        <div class="info-row">
          <span class="label">Hora:</span>
          <span class="value">${cita.horaInicio} - ${cita.horaFin}</span>
        </div>
        <div class="info-row">
          <span class="label">Especialista:</span>
          <span class="value">${cita.nombreEspecialista || 'Por asignar'}</span>
        </div>
        <div class="info-row">
          <span class="label">Servicios:</span>
          <span class="value">${serviciosLista}</span>
        </div>
        <div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #10b981;">
          <span class="label" style="font-size: 16px;">Total a pagar:</span>
          <span class="total">$${cita.total}</span>
        </div>
      </div>

      <div class="highlight">
        <span class="highlight-icon">💡</span>
        <strong>Tip:</strong> Te enviaremos un recordatorio 20 minutos antes de tu cita.
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL || 'https://nailspa-reservas.vercel.app'}/mis-citas" class="btn">
          Ver mis citas
        </a>
      </p>
    `;

    const mailOptions = {
      from: `"Nail Spa" <${process.env.EMAIL_USER}>`,
      to: cita.email,
      subject: `🎉 Cita Confirmada - ${fechaCita} a las ${cita.horaInicio}`,
      html: getEmailTemplate(content, 'Confirmación de Cita - Nail Spa')
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmación de cita enviada a ${cita.email}`);
    return true;
  } catch (error) {
    console.error('Error enviando confirmación:', error.message);
    return false;
  }
};

module.exports = {
  enviarFactura,
  enviarRecordatorio,
  enviarConfirmacionCita
};
