import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { Resend } from 'resend';
import { SystemUserService } from 'src/user/system-user/system-user.service';
import { LabService } from 'src/lab/services/lab.service';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly ourEmail = "Admin <biodesk@resend.dev>"

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

  async sendWelcomeEmail(email: string, userDto: RegisterDto) {

    if (userDto) {
      const html = await this.templateToHTML('welcome.mjml', {
        name: `${userDto.name} ${userDto.lastName}`,
        year: new Date().getFullYear(),
      });

      try {
        const emailResponse = await this.resend.emails.send({
          from: this.ourEmail,
          to: [email],
          subject: '¡Bienvenido a BioDESK!',
          html: html,
        });

        if (emailResponse.data?.id) {
          this.logger.log(`Correo de bienvenida enviado a ${email}`);
        } else {
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

  async sendWelcomeToLabEmail(email: string, labId: number, role: string) {
    const user = await this.systemUserService.getSystemUser({
      email,
    });

    const lab = await this.labService.getLabById(labId)
    
    if (user) {
      const html = await this.templateToHTML('welcome_to_lab.mjml', {
        name: `${user.name} ${user.lastName}`,
        labName: lab.name,
        role,
        year: new Date().getFullYear(),
      });

      try {
        await this.resend.emails.send({
          from: this.ourEmail,
          to: [email],
          subject: `¡Bienvenido a ${lab.name}!`,
          html: html,
        });
      } catch (error) {
        this.logger.log(error);
      }

      this.logger.log(`Correo de asignación a un laboratorio enviado a ${email}`);
    }
  }

  async sendChangePasswordEmail(email: string) {
    const user = await this.systemUserService.getSystemUser({
      email,
    });

    if (user) {
      const token = this.generateEmailToken();
      const html = await this.templateToHTML('change_password.mjml', {
        emailToken: token,
        year: new Date().getFullYear(),
      });

      try {
        await this.resend.emails.send({
          from: this.ourEmail,
          to: [email],
          subject: 'Código temporal para cambiar su contraseña',
          html: html,
        });
      } catch (error) {
        this.logger.log(error);
      }

      this.sharedCacheService.setEmailToken(email, token);
      this.logger.log(`Correo de cambio de contraseña enviado a ${email}`);
    }
  }

  // Genera un token alfanumérico de 6 caracteres (mayúsculas + números)
  private generateEmailToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
