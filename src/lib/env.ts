/**
 * Environment configuration helper
 * Checks Supabase configuration and provides helpful setup messages
 */

export interface EnvStatus {
  isConfigured: boolean;
  missingVars: string[];
  message: string;
}

const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export const checkEnvironment = (): EnvStatus => {
  const missingVars: string[] = [];

  for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!value || value === 'your-project-url' || value === 'your-anon-key') {
      missingVars.push(key);
    }
  }

  const isConfigured = missingVars.length === 0;

  let message = '';
  if (!isConfigured) {
    message = `
⚠️  URBAN MAYHEM STORE - Configuration Needed

Missing or unconfigured environment variables:
${missingVars.map((v) => `  • ${v}`).join('\n')}

The app is running in MOCK DATA MODE. To enable full functionality:

1. Create a Supabase project at https://supabase.com
2. Run the SQL migration in supabase/migrations/001_initial_schema.sql
3. Copy your project URL and anon key
4. Update the .env file in the project root:
   VITE_SUPABASE_URL=your-actual-project-url
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
5. Restart the dev server

For detailed setup instructions, see SETUP.md
    `.trim();
  } else {
    message = '✅ Environment configured correctly';
  }

  return { isConfigured, missingVars, message };
};

// Log environment status on startup
export const logEnvironmentStatus = (): void => {
  const status = checkEnvironment();

  if (!status.isConfigured) {
    console.warn(status.message);
  } else {
    console.log(status.message);
  }
};
