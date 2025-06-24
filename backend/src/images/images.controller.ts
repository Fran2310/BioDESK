import { Controller, Get, Param } from '@nestjs/common';
import { ImagesService } from './images.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('img')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Public()
  @Get(':filename')
  async getImage(@Param('filename') filename: string) {
    return this.imagesService.getImage(filename);
  }

  @Public()
  @Get('list/structure')
  async getStructure() {
    return this.imagesService.getDirectoryStructure();
  }
}
