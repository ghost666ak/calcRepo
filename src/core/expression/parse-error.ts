export interface ParseError {
  readonly message: string;
  readonly position: number;
  readonly hint: string;
}