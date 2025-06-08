import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';
import { SharedCacheService } from 'src/shared-cache/shared-cache.service';
import { UserService } from 'src/user/user.service';


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly sharedCacheService: SharedCacheService,
    private readonly userService: UserService,
  ) {}

  private async templateToHTML(templateName: string, dataJSON: object): Promise<string> {
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

  async sendWelcomeEmail(email: string) {
    const user = await this.userService.getSystemUser({email})

    if (user) {
      const html = await this.templateToHTML(
        'welcome.mjml',
        {
          name: `${user.name} + ${user.lastName}`,
          year: new Date().getFullYear()
        }
      )
  
      try {
        await this.mailerService.sendMail({
          to: email,
          subject: '¡Bienvenido a BioDESK!',
          html: html,
        });
      }
      catch (error) {
        this.logger.log(error)
      }
  
      this.logger.log(`Correo de bienvenida enviado a ${email}`);
    }
  }

  async sendChangePasswordEmail(email: string) {
    const user = await this.userService.getSystemUser({email})

    if (user) {
      const token = this.generateEmailToken()
      const html = await this.templateToHTML(
        'change_password.mjml',
        {
          emailToken: token,
          year: new Date().getFullYear()
        }
      )
  
      try {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Código temporal para cambiar su contraseña',
          html: html,
        });
      }
      catch (error) {
        this.logger.log(error)
      }
      
  
      this.sharedCacheService.setEmailToken(email, token)
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