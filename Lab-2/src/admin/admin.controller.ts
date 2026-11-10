import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UsersService } from '../users/users.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint 4: Admin-only privileged endpoint
   * Accessible ONLY by users with role 'ADMIN'.
   * Returns list of all registered users in the database (matches Page 8 of lab guide).
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAdminDashboard(@CurrentUser() user: any) {
    const users = await this.usersService.findAll();
    return {
      message: 'Access granted: Welcome to the Admin privileged endpoint',
      adminUser: user.username,
      totalUsers: users.length,
      users,
    };
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  async getAllUsersForAdmin(@CurrentUser() user: any) {
    const users = await this.usersService.findAll();
    return {
      message: 'User management list retrieved successfully (ADMIN privilege)',
      requestedBy: user.username,
      totalUsers: users.length,
      users,
    };
  }
}
