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
  Patch,
  ParseUUIDPipe,
  Delete,
  ParseArrayPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './system-user/dto/create-user.dto';
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
import { UpdateSystemUserDto } from './system-user/dto/update-system-user.dto';
import { SystemUserDto } from './dto/system-user.dto';
import { AssignExistingUserDto } from './lab-user/dto/assign-existing-user.dto';
import { SkipLabIdCheck } from 'src/auth/decorators/skip-lab-id-check.decorator';

@ApiBearerAuth()
@ApiTags('User')
@ApiHeaders([X_LAB_ID_HEADER])
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @SkipLabIdCheck()
  @ApiOperation({
    summary: 'Obtener datos del usuario que hace la consulta',
    description:
      'Devuelve los datos del usuario propetario del token JWT, el x-lab-id no hace falta',
  })
  async getDataUserMe(
    @Request() req,
  ) {
    const performedByUserUuid = req.user.sub;
    return this.userService.getDataUserMe(
      performedByUserUuid
    );
  }

  @Get('mix')
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
    name: 'search-term',
    required: false,
    description: 'Término a buscar. Si no está definido devuelve la lista paginada sin búsqueda',
    example: '',
    type: String,
  })
  @ApiQuery({
    name: 'search-fields',
    required: false,
    description: 'Campos donde buscar (array de strings) si existe un search-term. Si está vacío devuelve la lista paginada sin búsqueda',
    type: [String], // Esto indica que es un array de strings
    isArray: true, // Esto indica que el parámetro puede recibir múltiples valores
    example: ['ci', 'name', 'email'], // Ejemplo con valores
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
    @Query('search-term') searchTerm,
    @Query('search-fields', new ParseArrayPipe({ 
      optional: true,
      items: String,
      separator: ','  
    })) searchFields: string[] = [],
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
      searchTerm,
      searchFields,
    );
  }

  @Get('system')
  @CheckAbility({ actions: 'read', subject: 'SystemUser' })
  @ApiOperation({
    summary: 'consultar usuario registrado en el sistema central',
    description:
      'Devuelve un usuario que coincida con el dato de busqueda, uuid, email o ci (solamente uno de ellos)',
  })
  @ApiQuery({
    name: 'uuid',
    required: false,
    type: String,
    example: '4c13de10-a4d5-4e....',
    description: 'uuid del usuario a consultar',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    example: 'example@example.com',
    description: 'email del usuario a consultar',
  })
  @ApiQuery({
    name: 'ci',
    required: false,
    type: String,
    example: 'v12345678',
    description: 'ci (identificacion) del usuario a consultar',
  })
  async getSystemUser(
    @Query('uuid') uuid?: string,
    @Query('email') email?: string,
    @Query('ci') ci?: string,
  ): Promise<SystemUserDto> {
    const user = await this.userService.systemUserService.getSystemUser({
      uuid,
      email,
      ci,
      includeLabs: false, // Siempre false para este endpoint
    });

    // Eliminar campos sensibles explícitamente
    const { password, salt, lastAccess, isActive, ...safeUser } = user;

    return safeUser as SystemUserDto;
  }

  @Post('mix/create-with-role')
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

  @Post('mix/create-with-role-id')
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

  @Post('lab/assign-user-to-lab')
  @CheckAbility({ actions: 'create', subject: 'LabUser' })
  @ApiOperation({
    summary:
      'Asignar un usuario existente del sistema a un laboratorio con rol existente',
  })
  @ApiBody({ type: AssignExistingUserDto })
  async assignExistingUserToLab(
    @Body() dto: AssignExistingUserDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.userService.assignExistUserToLab(labId, dto, req.user.sub);
  }

  @Patch('system')
  @ApiOperation({ summary: 'Actualizar datos de un usuario del sistema' })
  @ApiQuery({
    name: 'uuid',
    required: true,
    type: String,
    description: 'UUID del usuario a actualizar',
  })
  @ApiBody({ type: UpdateSystemUserDto })
  async updateUser(
    @Query('uuid', ParseUUIDPipe) userUuid: string,
    @Body() dto: UpdateSystemUserDto,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedBy = req.user.sub;

    return this.userService.updateSystemUserData(
      userUuid,
      dto,
      labId,
      performedBy,
    );
  }

  @Patch('lab/assign-role')
  @CheckAbility({
    actions: 'update',
    subject: 'LabUser',
    fields: 'roleId',
  })
  @ApiOperation({
    summary: 'Actualizar/asignar el rol a un usuario del laboratorio',
    description:
      'Permite cambiar el rol de un usuario específico dentro del laboratorio actual.',
  })
  @ApiQuery({
    name: 'uuid',
    required: true,
    type: String,
    description:
      'UUID del usuario del sistema al que se le desea cambiar el rol.',
  })
  @ApiQuery({
    name: 'roleId',
    required: true,
    type: Number,
    example: 2,
    description: 'ID del nuevo rol que se le asignará al usuario.',
  })
  async updateUserRole(
    @Query('uuid') uuid: string,
    @Query('roleId', ParseIntPipe) roleId: number,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    const performedBy = req.user.sub;

    return this.userService.updateUserRole(labId, uuid, roleId, performedBy);
  }

  @Delete('lab/soft-delete')
  @CheckAbility({ actions: 'delete', subject: 'LabUser' })
  @ApiOperation({
    summary: 'Eliminar la asignación de un usuario a un laboratorio',
    description: `Esta operación elimina al usuario del laboratorio y su asignacion DB central, pero sin eliminar sus datos del sistema.`,
  })
  @ApiQuery({
    name: 'userUuid',
    type: String,
    required: true,
    description: 'UUID del usuario que se desea desvincular del laboratorio.',
    example: 'c5caef0a-95b3-4c6...',
  })
  async deleteUserAssignment(
    @Query('userUuid', ParseUUIDPipe) userUuid: string,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.userService.deleteAssignedUserToLab(
      labId,
      userUuid,
      req.user.sub,
    );
  }

  @Delete('system/hard-delete')
  @CheckAbility({ actions: 'delete', subject: 'SystemUser' })
  @ApiOperation({
    summary: 'Eliminar completamente un usuario del sistema',
    description:
      'Este endpoint elimina por completo a un usuario, siempre que no esté asignado a ningún laboratorio.',
  })
  @ApiQuery({
    name: 'userUuid',
    type: String,
    required: true,
    description: 'UUID del usuario a eliminar del sistema',
  })
  async deleteSystemUser(
    @Query('userUuid', ParseUUIDPipe) userUuid: string,
    @Request() req,
  ) {
    const labId = Number(req.headers['x-lab-id']);
    return this.userService.deleteTotalSystemUser(
      labId,
      userUuid,
      req.user.sub,
    );
  }
}
