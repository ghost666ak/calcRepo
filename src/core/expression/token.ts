export interface Token {
  readonly kind:
    | 'number'
    | 'ident'
    | 'plus'
    | 'minus'
    | 'star'
    | 'slash'
    | 'caret'
    | 'percent'
    | 'lparen'
    | 'rparen'
    | 'comma'
    | 'eof';
  readonly value: string;
  readonly position: number;
}