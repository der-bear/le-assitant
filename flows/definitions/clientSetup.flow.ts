/**
 * Client Setup Flow Definition
 * Guides users through creating a new LeadExec client with delivery configuration
 */

import { FlowDefinition } from '../types/flow.types';

export const clientSetupFlow: FlowDefinition = {
  id: 'create-new-client',
  name: 'Create New Client',
  description: 'Set up a new client with guided configuration including delivery methods and credentials',
  category: 'clients',
  metadata: {
    icon: 'Building',
    estimatedTime: '5-10 minutes',
    tags: ['client', 'setup', 'configuration', 'credentials']
  },
  steps: [
    {
      id: 'overview',
      type: 'overview',
      title: 'Client Setup Process',
      description: 'We\'ll guide you through the LeadExec client setup process',
      component: {
        kind: 'steps',
        props: {
          variant: 'overview',
          title: 'Client Setup Process',
          steps: [
            { id: 'basic-info', title: 'Basic Information', hint: 'Company details and contact info' },
            { id: 'delivery-method', title: 'Delivery Method', hint: 'Choose how leads will be sent' },
            { id: 'configuration', title: 'Configuration', hint: 'Set up preferences and settings' },
            { id: 'creation', title: 'Creation', hint: 'Create the client in LeadExec' },
            { id: 'review', title: 'Review', hint: 'Confirm setup and next steps' }
          ],
          showIndex: true
        }
      },
      actions: [
        {
          id: 'start-setup',
          label: 'Start Setup',
          icon: 'ArrowRight',
          type: 'primary',
          triggers: 'basic-info'
        }
      ],
      transitions: {
        'start-setup': 'basic-info'
      }
    },
    {
      id: 'basic-info',
      type: 'form',
      title: 'Basic Information',
      description: 'Enter basic client details. Credentials will be generated automatically.',
      component: {
        kind: 'form',
        props: {
          title: 'Client Information',
          description: 'Enter basic client details. Credentials will be generated automatically.',
          sections: [
            {
              id: 'basic',
              fields: [
                {
                  id: 'companyName',
                  label: 'Company Name',
                  type: 'text',
                  required: true,
                  placeholder: 'Enter company name'
                },
                {
                  id: 'email',
                  label: 'Email Address',
                  type: 'email',
                  required: true,
                  placeholder: 'Enter email address'
                }
              ]
            },
            {
              id: 'credentials',
              title: 'Client Credentials',
              description: 'Username and password will be auto-generated when you enter a valid email',
              fields: [
                {
                  id: 'username',
                  label: 'Username',
                  type: 'text',
                  required: false,
                  placeholder: 'Will be generated from email address'
                },
                {
                  id: 'tempPassword',
                  label: 'Password',
                  type: 'text',
                  required: false,
                  placeholder: 'Will be auto-generated securely'
                }
              ]
            }
          ],
          submitLabel: 'Continue'
        },
        derivation: [
          {
            fieldId: 'username',
            from: ['email'],
            strategy: 'usernameFromEmail',
            editable: true
          },
          {
            fieldId: 'tempPassword',
            from: ['email'],
            strategy: 'strongPassword',
            editable: true
          }
        ]
      },
      validation: {
        rules: [
          {
            fieldId: 'companyName',
            rule: 'required',
            message: 'Company name is required'
          },
          {
            fieldId: 'email',
            rule: 'required',
            message: 'Email address is required'
          },
          {
            fieldId: 'email',
            rule: 'regex',
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            message: 'Please enter a valid email address'
          }
        ]
      },
      transitions: {
        onComplete: 'delivery-method'
      }
    },
    {
      id: 'delivery-method',
      type: 'choice',
      title: 'Delivery Method',
      description: 'Choose how leads will be delivered to your client',
      component: {
        kind: 'choices',
        props: {
          title: 'Choose Delivery Method',
          description: 'Select how leads will be sent to your client',
          options: [
            {
              id: 'email',
              label: 'Email Delivery',
              description: 'Send leads directly to client email - simple and reliable',
              icon: 'Mail',
              badge: 'Popular'
            },
            {
              id: 'webhook',
              label: 'HTTP Webhook',
              description: 'Real-time API delivery to client systems',
              icon: 'Webhook'
            },
            {
              id: 'ftp',
              label: 'FTP Delivery',
              description: 'File transfer protocol for batch delivery',
              icon: 'Database'
            },
            {
              id: 'skip',
              label: 'Skip for Now',
              description: 'Set up delivery method later',
              icon: 'Clock'
            }
          ],
          mode: 'single',
          layout: 'card'
        }
      },
      transitions: {
        email: 'email-configuration',
        webhook: 'webhook-configuration',
        ftp: 'ftp-configuration',
        skip: 'creation'
      }
    },
    {
      id: 'email-configuration',
      type: 'form',
      title: 'Email Configuration',
      description: 'Configure email delivery settings',
      component: {
        kind: 'form',
        props: {
          title: 'Email Delivery Settings',
          description: 'Configure how leads will be sent via email',
          sections: [
            {
              id: 'email-settings',
              fields: [
                {
                  id: 'recipientEmail',
                  label: 'Recipient Email',
                  type: 'email',
                  required: true,
                  placeholder: 'client@example.com'
                },
                {
                  id: 'ccEmails',
                  label: 'CC Emails (optional)',
                  type: 'text',
                  required: false,
                  placeholder: 'Comma-separated emails'
                },
                {
                  id: 'frequency',
                  label: 'Delivery Frequency',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'immediate', label: 'Immediate' },
                    { value: 'hourly', label: 'Hourly Batch' },
                    { value: 'daily', label: 'Daily Summary' }
                  ]
                }
              ]
            }
          ],
          submitLabel: 'Save Configuration'
        }
      },
      transitions: {
        onComplete: 'creation'
      }
    },
    {
      id: 'webhook-configuration',
      type: 'form',
      title: 'Webhook Configuration',
      description: 'Configure webhook delivery settings',
      component: {
        kind: 'form',
        props: {
          title: 'Webhook Settings',
          description: 'Configure real-time API delivery',
          sections: [
            {
              id: 'webhook-settings',
              fields: [
                {
                  id: 'webhookUrl',
                  label: 'Webhook URL',
                  type: 'url',
                  required: true,
                  placeholder: 'https://api.example.com/leads'
                },
                {
                  id: 'authType',
                  label: 'Authentication Type',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'none', label: 'None' },
                    { value: 'bearer', label: 'Bearer Token' },
                    { value: 'apikey', label: 'API Key' }
                  ]
                },
                {
                  id: 'retryAttempts',
                  label: 'Retry Attempts',
                  type: 'number',
                  required: true,
                  defaultValue: 3
                }
              ]
            }
          ],
          submitLabel: 'Save Configuration'
        }
      },
      transitions: {
        onComplete: 'creation'
      }
    },
    {
      id: 'ftp-configuration',
      type: 'form',
      title: 'FTP Configuration',
      description: 'Configure FTP delivery settings',
      component: {
        kind: 'form',
        props: {
          title: 'FTP Settings',
          description: 'Configure file transfer protocol delivery',
          sections: [
            {
              id: 'ftp-settings',
              fields: [
                {
                  id: 'ftpHost',
                  label: 'FTP Host',
                  type: 'text',
                  required: true,
                  placeholder: 'ftp.example.com'
                },
                {
                  id: 'ftpPort',
                  label: 'Port',
                  type: 'number',
                  required: true,
                  defaultValue: 21
                },
                {
                  id: 'ftpUsername',
                  label: 'FTP Username',
                  type: 'text',
                  required: true
                },
                {
                  id: 'ftpPassword',
                  label: 'FTP Password',
                  type: 'password',
                  required: true
                },
                {
                  id: 'ftpDirectory',
                  label: 'Upload Directory',
                  type: 'text',
                  required: false,
                  placeholder: '/leads'
                }
              ]
            }
          ],
          submitLabel: 'Save Configuration'
        }
      },
      transitions: {
        onComplete: 'creation'
      }
    },
    {
      id: 'creation',
      type: 'process',
      title: 'Creating Client',
      description: 'Creating client in LeadExec system',
      component: {
        kind: 'process',
        props: {
          title: 'Creating Client',
          status: 'processing',
          message: 'Setting up your client in LeadExec...',
          details: [
            'Creating client account',
            'Generating secure credentials',
            'Configuring delivery settings',
            'Sending welcome email'
          ]
        }
      },
      transitions: {
        onComplete: 'review'
      }
    },
    {
      id: 'review',
      type: 'result',
      title: 'Setup Complete',
      description: 'Client has been successfully created',
      component: {
        kind: 'summary',
        props: {
          title: 'Client Setup Complete',
          items: [
            {
              id: 'client',
              title: 'Client Created',
              subtitle: '{companyName}',
              status: 'success',
              message: 'Client account successfully created'
            },
            {
              id: 'credentials',
              title: 'Credentials Generated',
              subtitle: 'Username: {username}',
              status: 'success',
              message: 'Secure password has been created'
            },
            {
              id: 'delivery',
              title: 'Delivery Configured',
              subtitle: '{deliveryMethod}',
              status: 'success',
              message: 'Lead delivery method configured'
            },
            {
              id: 'email',
              title: 'Welcome Email Sent',
              subtitle: '{email}',
              status: 'success',
              message: 'Client notified with login details'
            }
          ]
        }
      },
      suggestedActions: [
        {
          id: 'create-another',
          label: 'Create Another Client',
          icon: 'Plus',
          triggers: 'create-new-client'
        },
        {
          id: 'view-clients',
          label: 'View All Clients',
          icon: 'List',
          triggers: 'client-management'
        },
        {
          id: 'done',
          label: 'Done',
          icon: 'Check'
        }
      ],
      transitions: {
        'create-another': 'overview',
        'view-clients': 'client-management',
        'done': 'complete'
      }
    }
  ]
};