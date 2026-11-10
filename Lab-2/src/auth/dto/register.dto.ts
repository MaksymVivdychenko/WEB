import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../roles.enum.js';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: 'Role must be either USER or ADMIN' })
  roles?: Role[];
}
