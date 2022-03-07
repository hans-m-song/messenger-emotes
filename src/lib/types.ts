export interface StructuredError {
  name: string;
  message: string;
  stack?: string[];
  meta?: any;
}
