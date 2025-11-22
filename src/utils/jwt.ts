import jwt from 'jsonwebtoken';

/**
 * Creates a JWT token for a user.
 * @param payload The payload to sign, typically containing user ID and role.
 * @returns The generated JWT token.
 */
export const createToken = (payload: { id: string; role: string }) => {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '1d', // Token expires in 24 hours
    });
};
