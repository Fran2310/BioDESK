import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { CreateEmailOptions, Resend } from 'resend';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';
import { RegisterDto } from 'src/auth/dto/register.dto';

const public_storage_url = `${process.env.SUPABASE_URL}storage/v1/object/public/`
const banners = {
  bienvenida:         `${public_storage_url}images/banners/system/bienvenida.jpg`,
  cambiar_contrasena: `${public_storage_url}images/banners/system/cambiar_contrasena.jpg`,
  resultados_medicos: `${public_storage_url}images/banners/system/resultados_medicos.jpg`,
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly ourEmail = "BioDESK <biodesk@resend.dev>"

  constructor(
    private readonly sharedCacheService: SharedCacheService,
    private readonly systemUserService: SystemUserService,
    private readonly labService: LabService,
    @Optional() private readonly resend = new Resend(process.env.EMAIL_TOKEN),
  ) {}

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

  async sendMedicResults(lab, patient, requestMedicTest, pdfUrl: string) {
    if (lab && patient && requestMedicTest) {
      const formatDate = (dateISO: string) => { // Convertir la fecha ISO a formato legible (ej: "15 de junio de 2023, 2:30 PM")
        return new Date(dateISO).toLocaleString('es-ES', {
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
      })
      this.logger.log(`Correo de resultados enviados a ${patient.email}`);
    }
  }

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
      })
      this.logger.log(`Correo de bienvenida a ${userDto.email}`);
    }
  }

  async sendWelcomeToLabEmail(email: string, labId: number, role: string) {
    const user = await this.systemUserService.getSystemUser({
      email,
    });

    const lab = await this.labService.getLabById(labId)
    
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
      })

      this.logger.log(`Correo de asignación a un laboratorio enviado a ${email}`);
    }
  }

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
      })

      this.sharedCacheService.setEmailToken(email, token);
      this.logger.log(`Correo de cambio de contraseña enviado a ${email}`);
    }
  }

  // Genera un token alfanumérico de 6 caracteres (mayúsculas + números)
  private async generateEmailToken(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

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
