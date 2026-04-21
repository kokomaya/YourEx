export interface IAIProvider {
  readonly name: string;
  generate(prompt: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}
