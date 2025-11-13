import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailOptions, NetsCoreConfig } from '../types';

export class EmailService {
  private transporter: Transporter;
  private config: NetsCoreConfig['email'];
  private excludeDomains: string[] = [];
  private templatesDir: string;

  constructor(config: NetsCoreConfig) {
    this.config = config.email || {};
    this.excludeDomains = this.config.excludeDomains || [];
    this.templatesDir = config.templatesDir || path.join(process.cwd(), 'templates');

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port || 587,
      secure: this.config.secure || false,
      auth: this.config.auth
    });
  }

  private isValidEmailDomain(email: string): [boolean, string | null] {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return [false, 'Invalid email address'];
    }

    const emailDomain = email.split('@')[1];

    for (const domain of this.excludeDomains) {
      if (domain.endsWith('*')) {
        const domainPrefix = domain.slice(0, -1);
        if (emailDomain.startsWith(domainPrefix)) {
          return [false, domain];
        }
      } else if (emailDomain === domain) {
        return [false, domain];
      }
    }

    return [true, null];
  }

  private renderTemplate(templateName: string, context: Record<string, any>): string {
    const templatePath = path.join(this.templatesDir, templateName);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(context);
  }

  private addFooter(html: string): string {
    if (!this.config?.footer) {
      return html;
    }

    return html.replace('</body>', `${this.config.footer}</body>`);
  }

  async sendEmail(options: EmailOptions): Promise<[boolean, string, string]> {
    const {
      subject,
      email,
      template,
      context = {},
      txtTemplate,
      toQueued = true,
      force = false,
      html
    } = options;

    // Check if emails are disabled in development
    if (process.env.NODE_ENV === 'development' && !this.config?.debugEnabled && !force) {
      return [false, 'email_disabled', 'Emails are disabled in development mode'];
    }

    // Normalize email to array
    const emails = Array.isArray(email) ? email : [email];

    // Validate and filter emails
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    let reason = '';

    for (const em of emails) {
      const [isValid, domain] = this.isValidEmailDomain(em);
      if (!isValid) {
        invalidEmails.push(em);
        reason += ` ${domain}`;
      } else {
        validEmails.push(em);
      }
    }

    if (invalidEmails.length > 0) {
      console.error(`Excluded email domains: ${reason}`);
      reason = `Email domain excluded: ${invalidEmails.join(', ')} for domains: ${reason}`;
    }

    if (validEmails.length === 0) {
      return [false, 'empty_email', `No valid emails to send. ${reason}`];
    }

    // Render email content
    let contentHtml: string;

    try {
      if (template) {
        contentHtml = this.renderTemplate(template, context);
        contentHtml = this.addFooter(contentHtml);
      } else if (html) {
        const compiledTemplate = handlebars.compile(html);
        contentHtml = compiledTemplate(context);
        contentHtml = this.addFooter(contentHtml);
      } else {
        return [false, 'template_or_html_required', 'Template or HTML content is required'];
      }
    } catch (error: any) {
      console.error('Template error:', error);
      return [false, 'template_error', `Template error: ${error.message}`];
    }

    let contentTxt: string | undefined;
    if (txtTemplate) {
      try {
        contentTxt = this.renderTemplate(txtTemplate, context);
      } catch (error: any) {
        console.error('Text template error:', error);
      }
    }

    // Send or queue email
    if (toQueued) {
      // Queue email for later sending (implement queue logic)
      // For now, we'll send immediately
      // TODO: Implement proper queue with Bull or similar
    }

    try {
      const mailOptions = {
        from: this.config?.from || process.env.DEFAULT_FROM_EMAIL,
        to: validEmails,
        subject,
        html: contentHtml,
        text: contentTxt
      };

      const result = await this.transporter.sendMail(mailOptions);

      if (result) {
        return [true, 'email_sent', `Email sent successfully. ${reason}`.trim()];
      } else {
        return [false, 'email_not_sent', `Email could not be sent. ${reason}`.trim()];
      }
    } catch (error: any) {
      console.error('Email sending error:', error);
      return [false, 'email_not_sent', `Email error: ${error.message}. ${reason}`.trim()];
    }
  }

  async sendVerificationCodeEmail(email: string, code: string, userName?: string): Promise<[boolean, string, string]> {
    return this.sendEmail({
      subject: 'Your Verification Code',
      email,
      template: 'emails/verification_code.hbs',
      context: {
        code,
        userName: userName || 'User',
        expiresIn: '15 minutes'
      }
    });
  }

  async sendNewLoginNotification(email: string, deviceInfo: any): Promise<[boolean, string, string]> {
    return this.sendEmail({
      subject: 'New Login Detected',
      email,
      template: 'emails/new_login.hbs',
      context: {
        deviceName: deviceInfo.name,
        os: deviceInfo.os,
        location: deviceInfo.location || 'Unknown',
        time: new Date().toLocaleString()
      }
    });
  }
}

// Global email service instance
let emailService: EmailService | null = null;

export const initializeEmailService = (config: NetsCoreConfig): EmailService => {
  emailService = new EmailService(config);
  return emailService;
};

export const getEmailService = (): EmailService => {
  if (!emailService) {
    throw new Error('Email service not initialized. Call initializeEmailService first.');
  }
  return emailService;
};

export const sendEmail = async (options: EmailOptions): Promise<[boolean, string, string]> => {
  const service = getEmailService();
  return service.sendEmail(options);
};
