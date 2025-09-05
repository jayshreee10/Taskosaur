import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { EmailJobData, EmailTemplate } from './dto/email.dto';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP configuration missing. Email sending will be simulated.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Note: SMTP connection will be verified only when sending emails
  }

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { to, subject, template, data } = job.data;

    try {
      const html = this.generateEmailHTML(template, data);
      const text = this.generateEmailText(template, data);

      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.configService.get<string>(
            'SMTP_FROM',
            'noreply@taskosaur.com',
          ),
          to,
          subject,
          html,
          text,
        });

        this.logger.log(
          `Email sent successfully to ${to} using template ${template}`,
        );
      } else {
        // Simulate email sending for development
        this.logger.log(
          `📧 EMAIL SIMULATION - To: ${to}, Subject: ${subject}, Template: ${template}`,
        );
        this.logger.debug('Email data:', JSON.stringify(data, null, 2));
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  private generateEmailHTML(template: EmailTemplate, data: any): string {
    const baseStyles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .task-info { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #6366f1; }
        .priority-high { border-left-color: #ef4444; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    `;

    switch (template) {
      case EmailTemplate.TASK_ASSIGNED:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>🎯 Task Assigned</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.assignee.name}!</h2>
              <p>You've been assigned a new task by ${data.assignedBy.name}.</p>
              
              <div class="task-info priority-${data.task.priority?.toLowerCase()}">
                <h3>${data.task.key}: ${data.task.title}</h3>
                <p><strong>Project:</strong> ${data.project.name}</p>
                <p><strong>Priority:</strong> ${data.task.priority}</p>
                ${data.task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.task.dueDate).toLocaleDateString()}</p>` : ''}
                ${data.task.description ? `<p><strong>Description:</strong> ${data.task.description}</p>` : ''}
              </div>
              
              <a href="${data.taskUrl}" class="button">View Task</a>
              
              <p>Happy coding! 🚀</p>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
            </div>
          </div>
        `;

      case EmailTemplate.DUE_DATE_REMINDER:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>⏰ Task Due Soon</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.assignee.name}!</h2>
              <p>Your task is due in ${data.task.hoursUntilDue} hours.</p>
              
              <div class="task-info priority-${data.task.priority?.toLowerCase()}">
                <h3>${data.task.key}: ${data.task.title}</h3>
                <p><strong>Project:</strong> ${data.project.name}</p>
                <p><strong>Due Date:</strong> ${new Date(data.task.dueDate).toLocaleString()}</p>
                <p><strong>Priority:</strong> ${data.task.priority}</p>
              </div>
              
              <a href="${data.taskUrl}" class="button">Complete Task</a>
              
              <p>Don't let it slip! ⚡</p>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
            </div>
          </div>
        `;

      case EmailTemplate.TASK_STATUS_CHANGED:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>📋 Task Status Updated</h1>
            </div>
            <div class="content">
              <p>Task status has been updated.</p>
              
              <div class="task-info">
                <h3>${data.task.key}: ${data.task.title}</h3>
                <p><strong>Project:</strong> ${data.project.name}</p>
                <p><strong>Status changed:</strong> ${data.oldStatus.name} → ${data.newStatus.name}</p>
              </div>
              
              <a href="${data.taskUrl}" class="button">View Task</a>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
            </div>
          </div>
        `;

      case EmailTemplate.WEEKLY_SUMMARY:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Summary</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.user.name}!</h2>
              <p>Here's your weekly productivity summary:</p>
              
              <div class="task-info">
                <h3>📈 This Week's Stats</h3>
                <p><strong>Tasks Completed:</strong> ${data.summary.tasksCompleted}</p>
                <p><strong>Tasks Assigned:</strong> ${data.summary.tasksAssigned}</p>
                <p><strong>Time Tracked:</strong> ${data.summary.totalTimeSpent} hours</p>
              </div>
              
              ${
                data.summary.overdueTasks.length > 0
                  ? `
                <div class="task-info priority-high">
                  <h3>⚠️ Overdue Tasks (${data.summary.overdueTasks.length})</h3>
                  ${data.summary.overdueTasks
                    .map(
                      (task) => `
                    <p><a href="${task.url}">${task.key}: ${task.title}</a> (${task.project})</p>
                  `,
                    )
                    .join('')}
                </div>
              `
                  : '<p>🎉 No overdue tasks! Great job!</p>'
              }
              
              <p>Keep up the great work! 💪</p>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
            </div>
          </div>
        `;

      case EmailTemplate.PASSWORD_RESET:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>🔒 Reset Your Password</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.userName}!</h2>
              <p>We received a request to reset your Taskosaur account password.</p>
              
              <div class="task-info">
                <h3>🔑 Password Reset Request</h3>
                <p>If you requested this password reset, click the button below to set a new password:</p>
                <p><strong>This link expires in ${data.expiresIn}</strong></p>
              </div>
              
              <a href="${data.resetUrl}" class="button">Reset My Password</a>
              
              <div style="margin: 20px 0; padding: 15px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
                <p><strong>⚠️ Security Notice:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>If you didn't request this password reset, you can safely ignore this email</li>
                  <li>Your password won't be changed until you access the link above and create a new one</li>
                  <li>This reset link will expire in 24 hours for your security</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Stay secure! 🛡️</p>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
              <p>This email was sent because a password reset was requested for your account.</p>
            </div>
          </div>
        `;
      case EmailTemplate.PASSWORD_RESET_CONFIRMATION:
        return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>✅ Password Successfully Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.userName}!</h2>
            <p>Your Taskosaur account password has been successfully reset.</p>
            
            <div class="task-info">
              <h3>🔐 Password Reset Confirmation</h3>
              <p><strong>Reset completed:</strong> ${data.resetTime}</p>
              <p>Your password has been updated and all existing sessions have been logged out for security.</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
              <p><strong>✅ What happened:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Your password has been successfully changed</li>
                <li>All existing sessions have been logged out</li>
                <li>You can now log in with your new password</li>
              </ul>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
              <p><strong>🚨 Didn't make this change?</strong></p>
              <p>If you didn't reset your password, please contact our support team immediately at ${data.supportEmail || 'support@taskosaur.com'}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
            
            <p>Need help? Our support team is here to assist you.</p>
            
            <p>Stay secure! 🛡️</p>
          </div>
          <div class="footer">
            <p>Taskosaur - Modern Project Management</p>
            <p>This is a security notification about your account password change.</p>
            <p>If you have any concerns, please contact us at ${data.supportEmail || 'support@taskosaur.com'}</p>
          </div>
        </div>
      `;

      case EmailTemplate.SEND_INVITATION:
        return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited to Join ${data.entityName}!</h1>
          </div>
          <div class="content">
            <h2>Hi there!</h2>
            <p><strong>${data.inviterName}</strong> has invited you to join their ${data.entityType.toLowerCase()} on Taskosaur.</p>
            
            <div class="task-info">
              <h3>📋 Invitation Details</h3>
              <p><strong>${data.entityType}:</strong> ${data.entityName}</p>
              <p><strong>Role:</strong> ${data.role}</p>
              <p><strong>Invited by:</strong> ${data.inviterName}</p>
              <p><strong>Expires on:</strong> ${data.expiresAt}</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p><strong>🚀 What's Taskosaur?</strong></p>
              <p>Taskosaur is a modern project management tool that helps teams collaborate effectively, track progress, and deliver projects on time.</p>
            </div>
            
            <div style="margin: 20px 0; text-align: center;">
              <a href="${data.invitationUrl}" class="button">View Invitation</a>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
              <p><strong>📝 How it works:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Click the "View Invitation" button above</li>
                <li>Login to your Taskosaur account (or create one if new)</li>
                <li>Review the invitation details and accept or decline</li>
              </ul>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p><strong>⏰ Important:</strong></p>
              <p>This invitation will expire on <strong>${data.expiresAt}</strong>. Please respond before then to join the ${data.entityType.toLowerCase()}.</p>
            </div>
            
            <p>Looking forward to having you on the team! 🦕</p>
          </div>
          <div class="footer">
            <p>Taskosaur - Modern Project Management</p>
            <p>You received this invitation from ${data.inviterName}</p>
            <p>If you have any questions, please contact us at support@taskosaur.com</p>
          </div>
        </div>
      `;

      case EmailTemplate.INVITATION_ACCEPTED:
        return `
  ${baseStyles}
  <div class="container">
    <div class="header">
      <h1>🎉 Invitation Accepted!</h1>
    </div>
    <div class="content">
      <h2>Great news, ${data.inviterName}!</h2>
      <p><strong>${data.accepterName}</strong> has accepted your invitation to join the project.</p>
      
      <div class="task-info">
        <h3>👥 New Team Member</h3>
        <p><strong>Name:</strong> ${data.accepterName}</p>
        <p><strong>Email:</strong> ${data.accepterEmail}</p>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Role:</strong> ${data.role || 'Team Member'}</p>
        <p><strong>Joined on:</strong> ${data.acceptedDate}</p>
      </div>
      
      <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
        <p><strong>✅ What's next?</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>${data.accepterName} now has access to the project</li>
          <li>They can view and contribute to tasks</li>
          <li>You can assign them tasks and collaborate</li>
        </ul>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${data.projectId}" class="button">View Project</a>
      
      <p>Your team is growing! Time to get things done together. 🚀</p>
    </div>
    <div class="footer">
      <p>Taskosaur - Modern Project Management</p>
      <p>This notification confirms a new team member has joined your project.</p>
      <p>Need help? Contact us at ${data.supportEmail || 'support@taskosaur.com'}</p>
    </div>
  </div>
`;

      case EmailTemplate.INVITATION_DECLINED:
        return `
  ${baseStyles}
  <div class="container">
    <div class="header">
      <h1>📧 Invitation Response</h1>
    </div>
    <div class="content">
      <h2>Hi ${data.inviterName},</h2>
      <p><strong>${data.declinerName}</strong> has declined your invitation to join the project.</p>
      
      <div class="task-info">
        <h3>❌ Invitation Declined</h3>
        <p><strong>Name:</strong> ${data.declinerName}</p>
        <p><strong>Email:</strong> ${data.declinerEmail}</p>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Declined on:</strong> ${data.declinedDate}</p>
        ${data.declineReason ? `<p><strong>Reason:</strong> ${data.declineReason}</p>` : ''}
      </div>
      
      <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #64748b;">
        <p><strong>💡 What you can do:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Invite other team members to join the project</li>
          <li>Reach out to ${data.declinerName} directly if needed</li>
          <li>Continue building your project team</li>
        </ul>
      </div>
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${data.projectId}/team" class="button">Manage Team</a>
      
      <p>Don't worry - you can always invite more people to join your project! 🦕</p>
    </div>
    <div class="footer">
      <p>Taskosaur - Modern Project Management</p>
      <p>This notification is about your project invitation response.</p>
      <p>Need help finding team members? Contact us at ${data.supportEmail || 'support@taskosaur.com'}</p>
    </div>
  </div>
`;

      case EmailTemplate.INVITATION_EXPIRED:
        return `
                ${baseStyles}
                <div class="container">
                  <div class="header">
                    <h1>⏰ Invitation Expired</h1>
                  </div>
                  <div class="content">
                    <h2>Hi ${data.inviterName},</h2>
                    <p>Your invitation to <strong>${data.inviteeName}</strong> has expired without a response.</p>
                    
                    <div class="task-info">
                      <h3>📅 Expired Invitation</h3>
                      <p><strong>Invited user:</strong> ${data.inviteeName}</p>
                      <p><strong>Email:</strong> ${data.inviteeEmail}</p>
                      <p><strong>Project:</strong> ${data.projectName}</p>
                      <p><strong>Invited on:</strong> ${data.invitedDate}</p>
                      <p><strong>Expired on:</strong> ${data.expiredDate}</p>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
                      <p><strong>🔄 Want to try again?</strong></p>
                      <p>You can send a new invitation to ${data.inviteeName} if you'd still like them to join your project.</p>
                    </div>
                    
                    <div style="margin: 20px 0; text-align: center;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${data.projectId}/invite?email=${data.inviteeEmail}" class="button" style="margin-right: 10px;">Send New Invitation</a>
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${data.projectId}/team" class="button" style="background: #6b7280; margin-left: 10px;">Manage Team</a>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
                      <p><strong>💡 Pro tip:</strong></p>
                      <p>Consider reaching out to ${data.inviteeName} directly to let them know about the project and send a fresh invitation.</p>
                    </div>
                    
                    <p>Keep building your dream team! 🚀</p>
                  </div>
                  <div class="footer">
                    <p>Taskosaur - Modern Project Management</p>
                    <p>This is a notification about an expired project invitation.</p>
                    <p>Need help? Contact us at ${data.supportEmail || 'support@taskosaur.com'}</p>
                  </div>
                </div>
              `;

      default:
        return `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>📧 Taskosaur Notification</h1>
            </div>
            <div class="content">
              <p>You have a new notification from Taskosaur.</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
            <div class="footer">
              <p>Taskosaur - Modern Project Management</p>
            </div>
          </div>
        `;
    }
  }

  private generateEmailText(template: EmailTemplate, data: any): string {
    switch (template) {
      case EmailTemplate.TASK_ASSIGNED:
        return `
Task Assigned: ${data.task.title}

Hi ${data.assignee.name}!

You've been assigned a new task by ${data.assignedBy.name}.

Task: ${data.task.key} - ${data.task.title}
Project: ${data.project.name}
Priority: ${data.task.priority}
${data.task.dueDate ? `Due Date: ${new Date(data.task.dueDate).toLocaleDateString()}` : ''}

${data.task.description ? `Description: ${data.task.description}` : ''}

View task: ${data.taskUrl}

Happy coding! 🚀

--
Taskosaur - Modern Project Management
        `;

      case EmailTemplate.DUE_DATE_REMINDER:
        return `
Task Due Soon: ${data.task.title}

Hi ${data.assignee.name}!

Your task is due in ${data.task.hoursUntilDue} hours.

Task: ${data.task.key} - ${data.task.title}
Project: ${data.project.name}
Due Date: ${new Date(data.task.dueDate).toLocaleString()}
Priority: ${data.task.priority}

View task: ${data.taskUrl}

Don't let it slip! ⚡

--
Taskosaur - Modern Project Management
        `;

      case EmailTemplate.PASSWORD_RESET:
        return `
Reset Your Taskosaur Password

Hi ${data.userName}!

We received a request to reset your Taskosaur account password.

PASSWORD RESET REQUEST
If you requested this password reset, click the link below to set a new password:

${data.resetUrl}

This link expires in ${data.expiresIn}.

SECURITY NOTICE:
⚠️ If you didn't request this password reset, you can safely ignore this email
⚠️ Your password won't be changed until you access the link above and create a new one  
⚠️ This reset link will expire in 24 hours for your security

If you have any questions, please contact our support team.

Stay secure! 🛡️

--
Taskosaur - Modern Project Management
This email was sent because a password reset was requested for your account.
        `;

      default:
        return `Taskosaur Notification\n\n${JSON.stringify(data, null, 2)}`;
    }
  }
}
