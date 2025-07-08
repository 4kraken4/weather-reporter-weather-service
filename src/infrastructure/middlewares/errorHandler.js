import Config from '../../config/Config.js';

function isNetworkError(error) {
  return (
    error === 'ECONNABORTED' ||
    error === 'ECONNREFUSED' ||
    error === 'EOPENBREAKER' ||
    error === 'CircuitBreakerOpenError'
  );
}

const getServicePort = error => error?.baseURL?.split(':')[2]?.split('/')[0];

const getServiceName = port => {
  switch (port) {
    case Config.getInstance().services.user.port:
      return `the ${Config.getInstance().services.user.name}`;
    case Config.getInstance().services.authentication.port:
      return `the ${Config.getInstance().services.authentication.name}`;
    case Config.getInstance().services.movie.port:
      return `the ${Config.getInstance().services.movie.name}`;
    default:
      return 'an important';
  }
};

function handleNetworkError(error) {
  const port = getServicePort(error);
  const serviceName = getServiceName(port);
  return `It seems ${serviceName} service is currently unavailable. Please try again later.`;
}

const generateError = (status = 400, code) => {
  return {
    error: code,
    status
  };
};

function getError(error) {
  if (error?.code && isNetworkError(error.code)) {
    return error.code;
  } else if (
    error?.name &&
    error.name.includes('Sequelize') &&
    error.name.includes('Error')
  ) {
    return error.name;
  } else if (error.response) {
    let currentError = error.response;
    while (currentError.response) {
      if (currentError?.response) currentError = currentError.response;
    }
    if (currentError?.data?.code && isNetworkError(currentError.data.code)) {
      return currentError;
    }
    return error.response?.data?.error?.error || error.response?.data?.error;
  } else {
    return error.message;
  }
}

const errorList = {
  BadRequestError: generateError(400, 'BadRequestError'),
  InvalidSearchTermError: generateError(400, 'InvalidSearchTermError'),
  InvalidCountryCodeError: generateError(400, 'InvalidCountryCodeError'),
  InvalidRegionIdError: generateError(400, 'InvalidRegionIdError'),
  BulkWeatherArrayNotProvidedError: generateError(
    400,
    'BulkWeatherArrayNotProvidedError'
  ),
  NoCitiesProvidedError: generateError(400, 'NoCitiesProvidedError'),
  TooManyCitiesError: generateError(400, 'TooManyCitiesError'),
  UnauthorizedError: generateError(401, 'UnauthorizedError'),
  CORSDeniedError: generateError(401, 'CORSDeniedError'),
  TimeoutError: generateError(408, 'TimeoutError'),
  RegionNotFoundError: generateError(409, 'RegionNotFoundError'),
  RegionSearchError: generateError(409, 'RegionSearchError'),
  WeatherServiceError: generateError(409, 'WeatherServiceError'),
  InvalidRegionSearchTermError: generateError(409, 'InvalidRegionSearchTermError'),
  InternalServerError: generateError(500, 'InternalServerError'),
  CircuitBreakerOpenError: generateError(503, 'CircuitBreakerOpenError'),
  ECONNABORTED: generateError(503, 'ECONNABORTED'),
  ECONNREFUSED: generateError(503, 'ECONNREFUSED'),
  EOPENBREAKER: generateError(503, 'EOPENBREAKER')
};

const errorHandler = (err, _req, res, _next) => {
  const parsedError = getError(err);
  // parsedError comes from controlled error mapping, not user input
  // eslint-disable-next-line security/detect-object-injection
  let error = errorList[parsedError] || errorList.InternalServerError;

  // check if error is a network error
  if (error && isNetworkError(error)) {
    error = { error, baseURL: error?.baseURL || err?.config?.baseURL };
    error.message = handleNetworkError(error);
  }
  res.status(error.status).json({ error });
};

export default errorHandler;
