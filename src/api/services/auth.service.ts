import argon2 from 'argon2';
import { SignJWT } from 'jose';
import { createUser, getUserByEmail } from '../../db/user.db.js';
import { BadRequestError } from '../errors/BadRequestError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { JWT_EXP } from '../../shared/constants/auth.js';
import { JWT_SECRET } from '../../config/auth.js';

async function signToken(userId: string): Promise<string> {
    return await new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXP)
        .sign(JWT_SECRET);
}

export async function register(email: string, password: string): Promise<{ token: string }> {
    email = email.trim().toLowerCase();
    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
    });

    const createdUser = await createUser(email, passwordHash);
    if (!createdUser) throw new BadRequestError('Email already registered');

    const token = await signToken(createdUser.id);
    return { token };
}

export async function login(email: string, password: string): Promise<{ token: string }> {
    email = email.trim().toLowerCase();

    const user = await getUserByEmail(email);
    const password_hash = user?.password_hash ?? '';

    const isValid = await argon2.verify(password_hash, password);
    if (!isValid || !user) throw new UnauthorizedError('Invalid credentials');
    // Fun fact: most website prioritize ux over security. By having both user and password check, (if user check doesn't return early)
    //      Attackers can't find if an email is registred based on api response timing!
    // Also this is a security sensitive application :P

    const token = await signToken(user.id);
    return { token };
}
