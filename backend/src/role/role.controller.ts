// src/role/role.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Request,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { LabPrismaFactory } from 'src/lab-prisma/lab-prisma.factory';
import { SystemPrismaService } from 'src/system-prisma/system-prisma.service';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';

@ApiBearerAuth()
@ApiHeaders([X_LAB_ID_HEADER])
@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly labPrismaFactory: LabPrismaFactory,
    private readonly systemPrisma: SystemPrismaService,
  ) {}

  private async getPrismaClientFromRequest(req) {
    const labId = Number(req.headers['x-lab-id']);
    const dbName = await this.systemPrisma.getLabDbName(labId);
    return this.labPrismaFactory.createInstanceDB(dbName);
  }

  private async getPrismaClientFromLabId(labId: number) {
    const dbName = await this.systemPrisma.getLabDbName(labId);
    return this.labPrismaFactory.createInstanceDB(dbName);
  }

  @Get('get-all')
  @CheckAbility({
    actions: 'read',
    subject: 'Role',
  })
  @ApiOperation({ summary: 'Listar todos los roles del laboratorio' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description:
      'Cantidad máxima de roles a retornar. Por defecto es 10. Úsalo junto con offset para paginación.',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
    description:
      'Cantidad de elementos a omitir desde el inicio (para paginación). Por defecto es 0.',
  })
  async getAllRoles(
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('offset', ParseIntPipe) offset = 0,
    @Request() req,
  ) {
    const prisma = await this.getPrismaClientFromRequest(req);
    return this.roleService.getAllRoles(prisma, { limit, offset });
  }

  @Get('get-by-id')
  @CheckAbility({
    actions: 'read',
    subject: 'Role',
  })
  @ApiOperation({ summary: 'Obtener un rol por su ID' })
  @ApiQuery({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
    description:
      'ID numérico del rol a consultar. Este ID debe existir en la base de datos del laboratorio.',
  })
  async getRoleById(@Query('id', ParseIntPipe) id: number, @Request() req) {
    const prisma = await this.getPrismaClientFromRequest(req);
    return this.roleService.getRoleById(prisma, id);
  }

  @Get('users-by-role')
  @CheckAbility(
    {
      actions: 'read',
      subject: 'LabUser',
    },
    {
      actions: 'read',
      subject: 'SystemUser',
      fields: 'ci,name,lastName,email',
    },
  )
  @ApiOperation({
    summary: 'Obtener todos los usuarios asociados a un rol por su ID',
  })
  @ApiQuery({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID del rol para obtener sus usuarios asignados',
  })
  async getUsersByRoleId(
    @Query('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    const prisma = await this.getPrismaClientFromRequest(req);
    return this.roleService.getUsersByRoleId(prisma, id);
  }

  @Post('create')
  @CheckAbility({
    actions: 'create',
    subject: 'Role',
  })
  @ApiOperation({ summary: 'Crear un rol nuevo (si no existe)' })
  @ApiBody({ type: RoleDto })
  async createRole(@Body() roleDto: RoleDto, @Request() req) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.getPrismaClientFromLabId(labId);

    return this.roleService.createRoleIfNotExists(
      prisma,
      roleDto,
      labId,
      req.user.sub,
    );
  }

  @Patch('update')
  @CheckAbility({
    actions: 'update',
    subject: 'Role',
    fields: 'role,description,permissions',
  })
  @ApiOperation({ summary: 'Actualizar un rol existente por ID' })
  @ApiQuery({
    name: 'id',
    required: true,
    type: Number,
    example: 1,
    description:
      'ID del rol que se desea actualizar. Debe existir previamente en la base de datos.',
  })
  @ApiBody({ type: UpdateRoleDto })
  async updateRole(
    @Query('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRoleDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.getPrismaClientFromLabId(labId);

    return this.roleService.updateRoleById(
      prisma,
      id,
      updateDto,
      labId,
      req.user.sub,
    );
  }

  @Delete('delete')
  @CheckAbility({ actions: 'delete', subject: 'Role' })
  @ApiOperation({ summary: 'Eliminar un rol por ID' })
  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'ID del rol a eliminar',
  })
  async deleteRole(@Query('id', ParseIntPipe) id: number, @Request() req) {
    const labId = Number(req.headers['x-lab-id']);
    const prisma = await this.getPrismaClientFromLabId(labId);

    return this.roleService.deleteRoleById(prisma, id, labId, req.user.sub);
  }
}
