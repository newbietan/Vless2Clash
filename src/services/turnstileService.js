/**
 * Cloudflare Turnstile verification service
 */

export class TurnstileService {
    constructor(secretKey) {
        this.secretKey = secretKey;
        this.verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    }

    /**
     * Verify Turnstile token
     * @param {string} token - The turnstile response token
     * @param {string} remoteIp - The user's IP address (optional)
     * @returns {boolean} - Whether verification succeeded
     */
    async verify(token, remoteIp) {
        if (!this.secretKey) {
            // No secret key configured, skip verification
            return true;
        }

        if (!token) {
            return false;
        }

        try {
            const formData = new URLSearchParams();
            formData.append('secret', this.secretKey);
            formData.append('response', token);
            if (remoteIp) {
                formData.append('remoteip', remoteIp);
            }

            const res = await fetch(this.verifyUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const result = await res.json();
            return result.success === true;
        } catch (error) {
            console.error('Turnstile verification failed:', error);
            return false;
        }
    }

    /**
     * Check if Turnstile is configured
     */
    isEnabled() {
        return !!this.secretKey;
    }
}