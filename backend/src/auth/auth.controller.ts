import { BadRequestException, Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Res, UnauthorizedException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { AuthService } from "backend/src/auth/auth.service";
import { LoginRequestBody } from "shared/dto/auth/body/login-body.dto";
import { RegisterRequestBody } from "shared/dto/auth/body/register-body.dto";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestBody) : Promise<undefined> {
		try {
			await this.authService.register(dto.email, dto.password);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				if (error.code === 'P2002') {
					throw new BadRequestException('Email already exists')
				}
			}
			throw error
		}
  }

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Res({passthrough: true}) response: any, @Body() dto: LoginRequestBody) : Promise<undefined> {
		const validatedUser = await this.authService.validateUser(dto.email, dto.password);
		
		if (!validatedUser) {
			throw new UnauthorizedException("Invalid email or password");
		}

		try {
			const signedPayload = await this.authService.login(validatedUser);
			response.cookie('access_token', signedPayload.access_token, { httpOnly: true,sameSite: 'strict', maxAge: 3600000, });
		} catch (error) {
			console.error(error);
			throw new InternalServerErrorException("Unable to login user");			
		}

	}
}