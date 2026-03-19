export class NetworkError extends Error {
  readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CacheError";
  }
}

export class InvalidCurrencyError extends Error {
  constructor(readonly currency: string) {
    super(`Invalid currency: ${currency}`);
    this.name = "InvalidCurrencyError";
  }
}

export class NoDataError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
    readonly date?: string
  ) {
    super(
      `No rate data available for ${from} to ${to}${date ? ` on ${date}` : ""}`
    );
    this.name = "NoDataError";
  }
}