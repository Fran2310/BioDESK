import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { LabService } from './lab.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de tener este guard

@Controller('lab')
@UseGuards(JwtAuthGuard) // Protege todas las rutas del controlador
export class LabController {
  constructor(
    private readonly labService: LabService
) {}

  @Post('selected-lab')
  async selectedLab(@Request() req) {
    this.labService.selectedLab(req.user.sub, req.headers['x-lab-id']);
  }

  @Post('users')
  async getUsers(@Request() req) {
    
  }
}