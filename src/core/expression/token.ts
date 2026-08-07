export interface Token {
  readonly kind:
    | 'number'
    | 'plus'
    | 'minus'
    | 'star'
    | 'slash'
    | 'caret'
    | 'percent'
    | 'lparen'
    | 'rparen'
    | 'eof';
  readonly value: string;
  readonly position: number;
}