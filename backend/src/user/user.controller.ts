// src/user/user.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  Query,
  ParseIntPipe,
  Get,
  ParseBoolPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleDto } from 'src/role/dto/role.dto';
import { CheckAbility } from 'src/casl/decorators/check-ability.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiHeaders,
  getSchemaPath,
  ApiQuery,
} from '@nestjs/swagger';
import { X_LAB_ID_HEADER } from 'src/common/constants/api-headers.constant';
import { CreateUserWithRoleIdDto } from './dto/create-user-with-role-id.dto';

@ApiBearerAuth()
@ApiTags('User')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('data-lab-users')
  @CheckAbility(
    { actions: 'read', subject: 'LabUser' },
    { actions: 'read', subject: 'SystemUser' },
  )
  @ApiOperation({
    summary: 'Obtener usuarios de un laboratorio con su rol asignado',
    description:
      'Devuelve una lista paginada de usuarios de laboratorio, con su UUID y datos de rol (si existe).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Cantidad máxima de usuarios por página (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
    description: 'Cantidad de usuarios a omitir desde el inicio',
  })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    example: false,
    description:
      'Indica si se deben incluir los permisos del rol en la respuesta',
  })
  async getDataLabUsers(
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('includePermissions', ParseBoolPipe) includePermissions = false,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.userService.getDataLabUsers(
      labId,
      includePermissions,
      offset,
      limit,
    );
  }

  @Post('create-with-role')
  @CheckAbility(
    { actions: 'create', subject: 'LabUser' },
    { actions: 'create', subject: 'SystemUser' },
    { actions: 'create', subject: 'Role' },
  )
  @ApiOperation({
    summary: 'Crear un nuevo usuario y rol para el laboratorio actual',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user: { $ref: getSchemaPath(CreateUserDto) },
        role: { $ref: getSchemaPath(RoleDto) },
      },
    },
  })
  async createUserWithRole(
    @Body('user') userDto: CreateUserDto,
    @Body('role') roleDto: RoleDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedByUserUuid = req.user.sub;

    return this.userService.createUserWithRoleToLab(
      labId,
      userDto,
      roleDto,
      performedByUserUuid,
    );
  }

  @Post('create-with-role-id')
  @CheckAbility(
    {
      actions: 'create',
      subject: 'SystemUser',
    },
    {
      actions: 'create',
      subject: 'LabUser',
    },
  )
  @ApiOperation({
    summary:
      'Crear un nuevo usuario en el sistema y asignarle un rol existente en el laboratorio',
  })
  @ApiBody({ type: CreateUserWithRoleIdDto })
  async createUserWithRoleId(
    @Body() dto: CreateUserWithRoleIdDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.userService.createUserWithExistingRole(
      labId,
      dto,
      dto.roleId,
      req.user.sub,
    );
  }
}
