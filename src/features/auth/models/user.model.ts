/**
 * User interface representing authenticated user profile and metadata.
 */
export interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
  isVerified?: boolean;
  preferences?: {
    emailAlerts?: boolean;
    weeklyReport?: boolean;
    timezone?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
