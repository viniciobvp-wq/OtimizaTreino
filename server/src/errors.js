export class AppError extends Error {
  constructor(status, message, detalhes = undefined) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}

export class ValidationError extends AppError {
  constructor(erros) {
    super(400, 'Dados inválidos', erros);
  }
}

export class NotFoundError extends AppError {
  constructor(entidade = 'Registro') {
    super(404, `Não encontrado: ${entidade}`);
  }
}
