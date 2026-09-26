import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, Post, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { AuthService } from "backend/src/auth/auth.service";
import { JwtAuthGuard } from "backend/src/auth/jwt-auth.guard";
import { ReqUser } from "backend/src/shared/decorator/user.decorator";
import { IReqUser } from "backend/src/shared/types";
import { LoginRequestBody } from "shared/dto/auth/body/login-body.schema";
import { RegisterRequestBody } from "shared/dto/auth/body/register-body.schema";

const isProduction = process.env.NODE_ENV === 'production';

// Frontend and backend are on different sites in production, so the cookie needs sameSite 'none' + secure.
const cookieOptions = {
	httpOnly: true,
	sameSite: isProduction ? 'none' : 'strict',
	secure: isProduction,
	maxAge: 3600000,
} as const;

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

	@UseGuards(JwtAuthGuard)
	@Get('check')
	async authCheck(@ReqUser() user: IReqUser) : Promise<string> {
		return user.email
	}

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
			response.cookie('access_token', signedPayload.access_token, cookieOptions);
		} catch (error) {
			console.error(error);
			throw new InternalServerErrorException("Unable to login user");			
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post('logout')
	async logout(@Res({passthrough: true}) response: any) : Promise<undefined> {
		response.clearCookie('access_token', cookieOptions);
	}
}