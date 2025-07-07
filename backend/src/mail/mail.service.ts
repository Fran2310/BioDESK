import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { CreateEmailOptions, Resend } from 'resend';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';
import { RegisterDto } from 'src/auth/dto/register.dto';

const public_storage_url = `${process.env.SUPABASE_URL}storage/v1/object/public/`;
const banners = {
  bienvenida: `${public_storage_url}images/banners/system/bienvenida.jpg`,
  cambiar_contrasena: `${public_storage_url}images/banners/system/cambiar_contrasena.jpg`,
  resultados_medicos: `${public_storage_url}images/banners/system/resultados_medicos.jpg`,
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly ourEmail = 'BioDESK <biodesk@resend.dev>';

  constructor(
    private readonly sharedCacheService: SharedCacheService,
    private readonly systemUserService: SystemUserService,
    private readonly labService: LabService,
    @Optional() private readonly resend = new Resend(process.env.EMAIL_TOKEN),
  ) {}

  /**
   * Convierte una plantilla MJML en HTML, reemplazando variables usando Handlebars.
   *
   * @param templateName Nombre del archivo de plantilla MJML.
   * @param dataJSON Objeto con los datos a inyectar en la plantilla.
   * @returns HTML generado a partir de la plantilla y los datos proporcionados.
   */
  private async templateToHTML(
    templateName: string,
    dataJSON: object,
  ): Promise<string> {
    const mjml = require('mjml');

    // 1. Leer plantilla MJML
    const mjmlTemplatePath = join(__dirname, 'templates', templateName);
    const mjmlTemplate = readFileSync(mjmlTemplatePath, 'utf8');

    // 2. Compilar con Handlebars
    const template = Handlebars.compile(mjmlTemplate);
    const mjmlWithVariables = template(dataJSON);

    // 3. Convertir MJML a HTML
    const result = mjml(mjmlWithVariables);
    return result.html;
  }

  /**
   * Envía un correo electrónico al paciente con los resultados médicos adjuntos en PDF.
   *
   * @param lab - Información del laboratorio que realizó el examen.
   * @param patient - Datos del paciente que recibirá el correo.
   * @param requestMedicTest - Detalles de la solicitud del examen médico.
   * @param pdfUrl - URL del archivo PDF con los resultados médicos.
   *
   * El correo incluye un banner personalizado, fechas formateadas y el enlace al PDF.
   * Registra en el log el envío exitoso del correo.
   */
  async sendMedicResults(lab, patient, requestMedicTest, pdfUrl: string) {
    if (lab && patient && requestMedicTest) {
      const formatDate = (dateISO: string | null) => {
        // Acepta string o null
        // Si es null, usa la fecha actual
        const date = dateISO ? new Date(dateISO) : new Date().toISOString;
        return date.toLocaleString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      };

      const html = await this.templateToHTML('test_results.mjml', {
        bannerUrl: banners.resultados_medicos,
        labName: lab.name,
        name: `${patient.name} ${patient.lastName}`,
        requestedAt: formatDate(requestMedicTest.requestedAt),
        completedAt: formatDate(requestMedicTest.completedAt),
        pdfUrl,
        year: new Date().getFullYear(),
      });

      await this.sendEmail({
        from: this.ourEmail,
        to: [patient.email],
        subject: `${lab.name} | Resultados Médicos`,
        html: html,
      });
      this.logger.log(`Correo de resultados enviados a ${patient.email}`);
    }
  }

  /**
   * Envía un correo electrónico de bienvenida al usuario especificado usando una plantilla HTML personalizada.
   *
   * @param userDto - Objeto RegisterDto con la información del usuario destinatario.
   */
  async sendWelcomeEmail(userDto: RegisterDto) {
    if (userDto) {
      const html = await this.templateToHTML('welcome.mjml', {
        bannerUrl: banners.bienvenida,
        name: `${userDto.name} ${userDto.lastName}`,
        year: new Date().getFullYear(),
      });

      await this.sendEmail({
        from: this.ourEmail,
        to: [userDto.email],
        subject: '¡Bienvenido a BioDESK!',
        html: html,
      });
      this.logger.log(`Correo de bienvenida a ${userDto.email}`);
    }
  }

  /**
   * Envía un correo de bienvenida a un usuario asignado a un laboratorio específico.
   *
   * @param email - Correo electrónico del usuario destinatario.
   * @param labId - ID del laboratorio al que se asigna el usuario.
   * @param role - Rol asignado al usuario dentro del laboratorio.
   */
  async sendWelcomeToLabEmail(email: string, labId: number, role: string) {
    const user = await this.systemUserService.getSystemUser({
      email,
    });

    const lab = await this.labService.getLabById(labId);

    if (user) {
      const html = await this.templateToHTML('welcome_to_lab.mjml', {
        bannerUrl: banners.bienvenida,
        name: `${user.name} ${user.lastName}`,
        labName: lab.name,
        role,
        year: new Date().getFullYear(),
      });

      await this.sendEmail({
        from: this.ourEmail,
        to: [email],
        subject: `¡Bienvenido a ${lab.name}!`,
        html: html,
      });

      this.logger.log(
        `Correo de asignación a un laboratorio enviado a ${email}`,
      );
    }
  }

  /**
   * Envía un correo electrónico al usuario con un código temporal para cambiar su contraseña.
   *
   * @param email - Dirección de correo electrónico del usuario que solicita el cambio de contraseña.
   */
  async sendChangePasswordEmail(email: string) {
    const user = await this.systemUserService.getSystemUser({
      email,
    });

    if (user) {
      const token = await this.generateEmailToken();
      const html = await this.templateToHTML('change_password.mjml', {
        bannerUrl: banners.cambiar_contrasena,
        emailToken: token,
        year: new Date().getFullYear(),
      });

      await this.sendEmail({
        from: this.ourEmail,
        to: [email],
        subject: 'Código temporal para cambiar su contraseña',
        html: html,
      });

      this.sharedCacheService.setEmailToken(email, token);
      this.logger.log(`Correo de cambio de contraseña enviado a ${email}`);
    }
  }

  /**
   * Genera y retorna un token aleatorio de 6 caracteres alfanuméricos en mayúsculas (mayúsculas + números) para verificación de correo electrónico.
   * @returns Una promesa que resuelve con el token generado.
   */
  private async generateEmailToken(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Envía un correo electrónico utilizando el servicio Resend.
   *
   * @param options Opciones de configuración para el envío del correo.
   * @throws Lanza una excepción si ocurre un error durante el envío.
   */
  private async sendEmail(options: CreateEmailOptions) {
    try {
      const emailResponse = await this.resend.emails.send(options);
      if (!emailResponse.data?.id) {
        // TODO: Quitar cuando se coloque producción, hay que dejarlo así para desarrollo
        //throw new BadRequestException(
        //  'El correo no es válido o no existe',
        //);
      }
    } catch (error) {
      this.logger.log(error);
      throw error;
    }
  }
}
