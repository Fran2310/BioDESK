import { Injectable, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Injectable()
export class ImagesService {
  async getImage(filename: string): Promise<StreamableFile> {
    const file = createReadStream(join(process.cwd(), './img/', filename));
    return new StreamableFile(file);
  }
}
