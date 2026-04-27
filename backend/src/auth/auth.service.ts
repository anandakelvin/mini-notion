import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "backend/src/prisma/generated/prisma/client";
import { PrismaService } from "backend/src/prisma/prisma.service";
import bcrypt from 'bcrypt';
import { LoginResponseBody } from "shared/dto/auth/body/login-body.schema";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService
	) {}

	async validateUser(email: string, password: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: {
				email
			}
		})

		if (!user) {
			return null
		}

		if (!(await this.isPasswordMatched(user, password))) {
			return null
		}

		return user
			
	}

	async login(user: User): Promise<LoginResponseBody> {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

	async register(email: string, password: string): Promise<User> {
		return this.prisma.user.create({
			data: {
				email,
				password: await this.hashPassword(password),
			}
		})
	}

	private async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		const hash = await bcrypt.hash(password, salt);
		return hash
	}

	private async isPasswordMatched(user: User, inputPassword: string): Promise<boolean> {
		return bcrypt.compare(inputPassword, user.password)
	}
}