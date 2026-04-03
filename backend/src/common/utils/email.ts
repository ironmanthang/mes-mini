import nodemailer from 'nodemailer';

export interface EmailSendResult {
    success: boolean;
    method: 'smtp' | 'mock';
    error?: string;
}

export async function sendCredentialsEmail(email: string, tempPassword: string, fullName: string): Promise<EmailSendResult> {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    // Detection: If credentials are missing or the placeholder is used, it's Dev Mode.
    if (!user || !pass || pass === 'your_app_password_here') {
        console.warn('🛠️  DEV MODE: GMAIL_USER or GMAIL_APP_PASSWORD is not configured. Email will NOT be sent.');
        console.warn(`📊 Mock Payload for ${fullName}: [User: ${email}] [Pass: ${tempPassword}]`);
        return { success: true, method: 'mock' };
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"MES System" <${user}>`,
            to: email,
            subject: 'Your Account Credentials - MES System',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
                    <h2 style="color: #333;">Welcome to the Production Operations System</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Your account has been successfully created. Below are your login credentials:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Username:</strong> ${email}</p>
                        <p style="margin: 5px 0 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px;">${tempPassword}</span></p>
                    </div>
                    <p style="color: #d9534f; font-size: 13px;"><em>Note: Please log in and change your password immediately upon accessing the system.</em></p>
                    <p>Best regards,<br><strong>System Administrator</strong></p>
                </div>
            `,
        });

        console.log(`✅ Credentials email sent successfully to ${email} [ID: ${info.messageId}]`);
        return { success: true, method: 'smtp' };
    } catch (err) {
        console.error('❌ Failed to send credentials email (Nodemailer Error):', err);
        return { success: false, method: 'smtp', error: (err as Error).message };
    }
}

