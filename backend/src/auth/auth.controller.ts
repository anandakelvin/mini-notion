import { Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Res, UnauthorizedException } from "@nestjs/common";
import { LoginRequestBodyDto } from "shared/dto/auth/body/login-body.dto";
import { RegisterRequestBodyDto } from "shared/dto/auth/body/register-body.dto";
import { AuthService } from "src/auth/auth.service";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestBodyDto) : Promise<undefined> {
		try {
    	await this.authService.register(dto.email, dto.password);
		} catch (error) {
			console.error(error);
			throw new InternalServerErrorException("Unable to register user");			
		}
  }

	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Res({passthrough: true}) response: any, @Body() dto: LoginRequestBodyDto) : Promise<undefined> {
		try {
			const validatedUser = await this.authService.validateUser(dto.email, dto.password);
			
			if (!validatedUser) {
				throw new UnauthorizedException("Invalid email or password");
			}

			const signedPayload = await this.authService.login(validatedUser);
			response.setCookie('access_token', signedPayload.access_token, { httpOnly: true,sameSite: 'strict', maxAge: 3600000, });
		} catch (error) {
			console.error(error);
			throw new InternalServerErrorException("Unable to login user");			
		}

	}
}