import { IsEmail, IsOptional, MinLength, IsString } from "class-validator";

export class RegisterDto {
    @IsEmail() 
    email!: string;

    @IsString() 
    @MinLength(1)  
    name!: string;

    @IsString() 
    @MinLength(6) 
    password!: string;
    
    @IsOptional() 
    @IsString() 
    image?: string; 
  }                     