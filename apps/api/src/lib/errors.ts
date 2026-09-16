export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(404, "not_found", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise.") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acces refuse.") {
    super(403, "forbidden", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Donnees invalides.") {
    super(400, "validation_error", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit.") {
    super(409, "conflict", message);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Traitement impossible.") {
    super(422, "unprocessable_entity", message);
  }
}
