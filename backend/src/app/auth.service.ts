import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { User } from "src/prisma/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService
	) {}

	async login(email: string, password: string): Promise<User | null> {
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