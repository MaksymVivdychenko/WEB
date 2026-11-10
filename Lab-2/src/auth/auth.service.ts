import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from './roles.enum.js';
import { getStudentConfig } from '../config/student.config.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
  }> {
    const existingUser = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUser) {
      throw new ConflictException(
        `User with username "${registerDto.username}" already exists`,
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const roles =
      registerDto.roles && registerDto.roles.length > 0
        ? registerDto.roles
        : [Role.USER];

    const newUser = await this.usersService.create({
      username: registerDto.username,
      password: hashedPassword,
      roles,
    });

    const { password, ...userWithoutPassword } = newUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    token: string;
    tokenType: string;
    expiresIn: number;
    studentInfo: {
      lastName: string;
      initials: string;
      group: string;
      variant: number;
      calculatedExpiration: string;
    };
  }> {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const currentConfig = getStudentConfig();
    const expiresInSeconds = currentConfig.getExpiresInSeconds();

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      student: {
        lastName: currentConfig.lastName,
        initials: currentConfig.initials,
        group: currentConfig.group,
        variant: currentConfig.variant,
      },
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: `${expiresInSeconds}s`,
    });

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      studentInfo: {
        lastName: currentConfig.lastName,
        initials: currentConfig.initials,
        group: currentConfig.group,
        variant: currentConfig.variant,
        calculatedExpiration: `60 + ${currentConfig.variant} = ${expiresInSeconds}s`,
      },
    };
  }
}
