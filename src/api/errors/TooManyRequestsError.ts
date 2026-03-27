import { AppError } from './AppError.js';

export class TooManyRequestsError extends AppError {
    timeLeftInSec?: number; // TBD

    constructor(message: string, timeLeftInSec?: number) {
        super(message, 429);
        this.timeLeftInSec = timeLeftInSec;
    }
}
