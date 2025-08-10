/**
 * Bulk Upload Flow Definition
 * Guides users through uploading multiple clients via Excel/CSV file
 */

import { FlowDefinition } from '../types/flow.types';

export const bulkUploadFlow: FlowDefinition = {
  id: 'bulk-client-upload',
  name: 'Bulk Client Upload',
  description: 'Upload multiple clients at once using an Excel file with automatic credential generation',
  category: 'clients',
  metadata: {
    icon: 'Upload',
    estimatedTime: '5-10 minutes',
    tags: ['client', 'bulk', 'upload', 'excel', 'csv']
  },
  steps: [
    {
      id: 'overview',
      type: 'overview',
      title: 'Bulk Upload Process',
      description: 'Upload multiple clients at once using an Excel file. The system will automatically generate usernames and passwords for each client.',
      component: {
        kind: 'steps',
        props: {
          variant: 'overview',
          title: 'Bulk Upload Process',
          steps: [
            { id: 'prepare', title: 'Prepare File', hint: 'Download template and prepare your data' },
            { id: 'upload', title: 'Upload File', hint: 'Upload your Excel or CSV file' },
            { id: 'validate', title: 'Validation', hint: 'System validates the data' },
            { id: 'processing', title: 'Processing', hint: 'Create clients and generate credentials' },
            { id: 'results', title: 'Results', hint: 'Review upload results and next steps' }
          ],
          showIndex: true
        }
      },
      actions: [
        {
          id: 'start-bulk-upload',
          label: 'Start Bulk Upload',
          icon: 'ArrowRight',
          type: 'primary',
          triggers: 'prepare'
        }
      ],
      transitions: {
        'start-bulk-upload': 'prepare'
      }
    },
    {
      id: 'prepare',
      type: 'choice',
      title: 'Prepare Your Data',
      description: 'Download our template or use your own Excel/CSV file with the required columns',
      component: {
        kind: 'alert',
        props: {
          type: 'info',
          title: 'Data Preparation',
          message: 'You can download our Excel template with all required columns, or prepare your own file with: Company Name, Email, Contact Name (optional), Phone (optional)'
        }
      },
      suggestedActions: [
        {
          id: 'download-template',
          label: 'Download Excel Template',
          icon: 'Download',
          triggers: 'download-confirm'
        },
        {
          id: 'use-own-file',
          label: 'I have my own file ready',
          icon: 'FileCheck',
          triggers: 'upload'
        }
      ],
      transitions: {
        'download-template': 'download-confirm',
        'use-own-file': 'upload'
      }
    },
    {
      id: 'download-confirm',
      type: 'result',
      title: 'Template Downloaded',
      description: 'Template has been downloaded to your computer',
      component: {
        kind: 'alert',
        props: {
          type: 'info',
          title: 'Template Downloaded',
          message: 'Check your downloads folder for "client_upload_template.xlsx". Fill it out with your client data and proceed when ready.'
        }
      },
      suggestedActions: [
        {
          id: 'ready-to-upload',
          label: 'Ready to Upload',
          icon: 'Upload',
          triggers: 'upload'
        }
      ],
      transitions: {
        'ready-to-upload': 'upload'
      }
    },
    {
      id: 'upload',
      type: 'upload',
      title: 'Upload Client Data',
      description: 'Upload your Excel or CSV file with client data',
      component: {
        kind: 'filedrop',
        props: {
          title: 'Upload Client Data',
          description: 'Upload your Excel (.xlsx, .xls) or CSV file',
          accept: '.xlsx,.xls,.csv',
          multiple: false,
          maxSizeMb: 10
        }
      },
      transitions: {
        onComplete: 'validate'
      }
    },
    {
      id: 'validate',
      type: 'process',
      title: 'Validating Data',
      description: 'Validating file format and data integrity',
      component: {
        kind: 'process',
        props: {
          title: 'Validating Data',
          status: 'processing',
          message: 'Checking file format and data integrity...',
          details: [
            'Verifying column headers',
            'Checking required fields',
            'Validating email formats',
            'Detecting duplicates'
          ]
        }
      },
      transitions: {
        onComplete: 'validation-result'
      }
    },
    {
      id: 'validation-result',
      type: 'result',
      title: 'Validation Complete',
      description: 'Data validation results',
      component: {
        kind: 'process',
        props: {
          title: 'Validation Complete',
          status: 'success',
          message: 'All data validated successfully!',
          details: [
            '✓ 25 valid client records found',
            '✓ All required fields present',
            '✓ Email formats valid',
            '✓ No duplicates detected'
          ]
        }
      },
      transitions: {
        onComplete: 'processing'
      }
    },
    {
      id: 'processing',
      type: 'process',
      title: 'Processing Upload',
      description: 'Creating client accounts and generating credentials',
      component: {
        kind: 'steps',
        props: {
          variant: 'progress',
          title: 'Processing Bulk Upload',
          steps: [
            { id: 'create-accounts', title: 'Creating client accounts' },
            { id: 'generate-credentials', title: 'Generating secure credentials' },
            { id: 'setup-delivery', title: 'Setting up delivery methods' },
            { id: 'send-emails', title: 'Sending welcome emails' }
          ],
          status: {
            'create-accounts': 'current',
            'generate-credentials': 'todo',
            'setup-delivery': 'todo',
            'send-emails': 'todo'
          },
          current: 'create-accounts'
        }
      },
      transitions: {
        onComplete: 'results'
      }
    },
    {
      id: 'results',
      type: 'result',
      title: 'Upload Complete',
      description: 'All clients have been successfully created',
      component: {
        kind: 'composite',
        props: {
          components: [
            {
              kind: 'alert',
              props: {
                type: 'success',
                title: 'Upload Complete!',
                message: 'All clients have been created and welcome emails sent.'
              }
            },
            {
              kind: 'summary',
              props: {
                title: 'Upload Results',
                items: [
                  {
                    id: 'total',
                    title: 'Total Clients Processed',
                    subtitle: '25',
                    status: 'success',
                    message: 'All clients successfully created'
                  },
                  {
                    id: 'credentials',
                    title: 'Credentials Generated',
                    subtitle: '25',
                    status: 'success',
                    message: 'Unique usernames and secure passwords'
                  },
                  {
                    id: 'emails',
                    title: 'Welcome Emails Sent',
                    subtitle: '25',
                    status: 'success',
                    message: 'Clients notified with login details'
                  }
                ],
                actions: [
                  { id: 'download-report', label: 'Download Report' },
                  { id: 'view-clients', label: 'View Clients' }
                ]
              }
            }
          ]
        }
      },
      suggestedActions: [
        {
          id: 'new-bulk-upload',
          label: 'Upload More Clients',
          icon: 'Upload',
          triggers: 'bulk-client-upload'
        },
        {
          id: 'configure-delivery',
          label: 'Configure Delivery Methods',
          icon: 'Settings',
          triggers: 'delivery-configuration'
        },
        {
          id: 'done',
          label: 'Done',
          icon: 'Check'
        }
      ],
      transitions: {
        'new-bulk-upload': 'overview',
        'configure-delivery': 'delivery-configuration',
        'done': 'complete',
        'download-report': 'download-report',
        'view-clients': 'client-management'
      }
    },
    {
      id: 'download-report',
      type: 'result',
      title: 'Report Downloaded',
      description: 'Upload report has been downloaded',
      component: {
        kind: 'alert',
        props: {
          type: 'info',
          title: 'Report Downloaded',
          message: 'Check your downloads folder for "bulk_upload_report.xlsx". The file contains all client details including their generated credentials.'
        }
      },
      transitions: {
        onComplete: 'results'
      }
    }
  ]
};